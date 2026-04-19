import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
export const inngest = new Inngest({ id: "movie-ticket-booking" });

// Inngest Function to save user data to a database
const syncUserCreation = inngest.createFunction(
  {
    id: "sync-user-from-clerk",
    triggers: [{ event: "clerk/user.created" }],
  },
  async ({ event, step }) => {
    await step.run("create-user-in-db", async () => {
      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      if (!id || !email_addresses || !email_addresses[0]?.email_address) {
        throw new Error("Invalid user data from Clerk");
      }

      const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url || null,
      };

      try {
        await User.create(userData);
        console.log(`User created successfully: ${id}`);
      } catch (error) {
        console.error("Failed to create user:", error);
        throw error; // Inngest will retry
      }
    });
  }
);

// Inngest Function to delete user data in database
const syncUserDeletion = inngest.createFunction(
  {
    id: "delete-user-with-clerk",
    triggers: [{ event: "clerk/user.deleted" }],
  },
  async ({ event, step }) => {
    await step.run("delete-user-from-db", async () => {
      const { id } = event.data;

      if (!id) {
        throw new Error("User ID is required for deletion");
      }

      try {
        const result = await User.findByIdAndDelete(id);
        if (!result) {
          console.warn(`User with id ${id} not found for deletion`);
        } else {
          console.log(`User deleted successfully: ${id}`);
        }
      } catch (error) {
        console.error("Failed to delete user:", error);
        throw error;
      }
    });
  }
);

// Inngest Function to update user data in database
const syncUserUpdation = inngest.createFunction(
  {
    id: "update-user-from-clerk",
    triggers: [{ event: "clerk/user.updated" }],
  },
  async ({ event, step }) => {
    await step.run("update-user-in-db", async () => {
      const { id, first_name, last_name, email_addresses, image_url } =
        event.data;

      if (!id || !email_addresses || !email_addresses[0]?.email_address) {
        throw new Error("Invalid user data from Clerk");
      }

      const userData = {
        _id: id,
        email: email_addresses[0].email_address,
        name: `${first_name || ""} ${last_name || ""}`.trim(),
        image: image_url || null,
      };

      try {
        const result = await User.findByIdAndUpdate(id, userData, {
          new: true,
        });
        if (!result) {
          console.warn(`User with id ${id} not found for update`);
        } else {
          console.log(`User updated successfully: ${id}`);
        }
      } catch (error) {
        console.error("Failed to update user:", error);
        throw error;
      }
    });
  }
);

// Inngest Function to cancel booking and release seats of show after 10 minutes of booking created if payment is not made
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  {
    id: "release-seats-delete-booking",
    triggers: [{ event: "app/checkpayment" }],
  },
  async ({ event, step }) => {
    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const bookingId = event.data.bookingId;

      if (!bookingId) {
        throw new Error("Booking ID is required");
      }

      const booking = await Booking.findById(bookingId);

      // If booking doesn't exist or payment is made, return early
      if (!booking) {
        console.warn(`Booking with id ${bookingId} not found`);
        return;
      }

      if (booking.isPaid) {
        console.log(`Booking ${bookingId} is already paid, skipping release`);
        return;
      }

      // Payment is not made, release seats and delete booking
      const show = await Show.findById(booking.show);

      if (!show) {
        console.warn(`Show with id ${booking.show} not found`);
        await Booking.findByIdAndDelete(booking._id);
        return;
      }

      try {
        // Release seats safely
        if (booking.bookedSeats && booking.bookedSeats.length > 0) {
          booking.bookedSeats.forEach((seat) => {
            if (show.occupiedSeats && show.occupiedSeats[seat]) {
              delete show.occupiedSeats[seat];
            }
          });

          show.markModified("occupiedSeats");
          await show.save();
        }

        await Booking.findByIdAndDelete(booking._id);
        console.log(`Booking ${bookingId} released and deleted due to unpaid status`);
      } catch (error) {
        console.error("Failed to release seats and delete booking:", error);
        throw error;
      }
    });
  }
);

// Inngest Function to send email when user books a show
const sendBookingConfirmationEmail = inngest.createFunction(
  {
    id: "send-booking-confirmation-email",
    triggers: [{ event: "app/show.booked" }],
  },
  async ({ event, step }) => {
    const { bookingId } = event.data;

    if (!bookingId) {
      throw new Error("Booking ID is required");
    }

    await step.run("send-confirmation-email", async () => {
      const booking = await Booking.findById(bookingId)
        .populate({
          path: "show",
          populate: { path: "movie", model: "Movie" },
        })
        .populate("user");

      if (!booking || !booking.user || !booking.show) {
        console.warn(`Booking ${bookingId} or related data not found`);
        return;
      }

      const movieTitle = booking.show.movie?.title || "Unknown Movie";
      const showDateTime = new Date(booking.show.showDateTime);
      const formattedDate = showDateTime.toLocaleDateString("en-US", {
        timeZone: "Asia/Dhaka",
      });
      const formattedTime = showDateTime.toLocaleTimeString("en-US", {
        timeZone: "Asia/Dhaka",
      });

      try {
        await sendEmail({
          to: booking.user.email,
          subject: `Payment Confirmation: "${movieTitle}" booked!`,
          body: `<div style="font-family: Arial, sans-serif; line-height: 1.5;">
      <h2>Hi ${booking.user.name},</h2>
      <p>
        Your booking for 
        <strong style="color: #F84565;">"${movieTitle}"</strong> is confirmed.
      </p>
      <p>
        <strong>Date:</strong> ${formattedDate}<br/>
        <strong>Time:</strong> ${formattedTime}
      </p>
      <p>Enjoy the show! 🍿</p>
      <p>
        Thanks for booking with us!<br/>
        - QuickShow Team
      </p>
    </div>`,
        });
        console.log(`Booking confirmation email sent for booking ${bookingId}`);
      } catch (error) {
        console.error("Failed to send booking confirmation email:", error);
        throw error;
      }
    });
  }
);

// Inngest Function to send reminders
const sendShowReminders = inngest.createFunction(
  {
    id: "send-show-reminders",
    triggers: [{ cron: "0 */8 * * *" }],
  },
  async ({ step }) => {
    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {
      const now = new Date();
      const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
      const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

      try {
        const shows = await Show.find({
          showDateTime: { $gte: windowStart, $lte: in8Hours },
        }).populate("movie");

        const tasks = [];

        for (const show of shows) {
          if (!show.movie || !show.occupiedSeats) {
            continue;
          }

          const userIds = [...new Set(Object.values(show.occupiedSeats))];
          if (userIds.length === 0) {
            continue;
          }

          const users = await User.find({ _id: { $in: userIds } }).select(
            "name email"
          );

          for (const user of users) {
            if (user.email && user.name) {
              tasks.push({
                userEmail: user.email,
                userName: user.name,
                movieTitle: show.movie.title || "Unknown Movie",
                showDateTime: show.showDateTime,
              });
            }
          }
        }

        return tasks;
      } catch (error) {
        console.error("Failed to prepare reminder tasks:", error);
        throw error;
      }
    });

    if (reminderTasks.length === 0) {
      return { sent: 0, failed: 0, message: "No reminders to send." };
    }

    // Send reminder emails in parallel
    const results = await step.run("send-all-reminders", async () => {
      return await Promise.allSettled(
        reminderTasks.map((task) =>
          sendEmail({
            to: task.userEmail,
            subject: `Reminder: Your movie "${task.movieTitle}" starts soon!`,
            body: `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
      <h2>Hello ${task.userName},</h2>
      <p>This is a quick reminder that your movie:</p>
      <h3 style="color: #F84565; margin: 10px 0;">"${task.movieTitle}"</h3>

      <p>
        is scheduled for
        <strong>
          ${new Date(task.showDateTime).toLocaleDateString("en-US", {
            timeZone: "Asia/Dhaka",
          })}
        </strong>
        at
        <strong>
          ${new Date(task.showDateTime).toLocaleTimeString("en-US", {
            timeZone: "Asia/Dhaka",
          })}
        </strong>.
      </p>

      <p style="margin-top: 10px;">
        It starts in approximately <strong>8 hours</strong> — make sure you're ready!
      </p>

      <p style="margin-top: 20px;">
        Enjoy the show! 🍿<br/>
        <span style="color: #F84565; font-weight: bold;">– QuickShow Team</span>
      </p>
    </div>`,
          })
        )
      );
    });

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    console.log(
      `Reminder emails: ${sent} sent, ${failed} failed out of ${results.length}`
    );

    return {
      sent,
      failed,
      message: `Sent ${sent} reminder(s), ${failed} failed.`,
    };
  }
);

// Inngest Function to send notifications when a new show is added
const sendNewShowNotifications = inngest.createFunction(
  {
    id: "send-new-show-notifications",
    triggers: [{ event: "app/show.added" }],
  },
  async ({ event, step }) => {
    const { movieTitle } = event.data;

    if (!movieTitle) {
      throw new Error("Movie title is required");
    }

    const users = await step.run("fetch-all-users", async () => {
      try {
        return await User.find({}).select("name email");
      } catch (error) {
        console.error("Failed to fetch users:", error);
        throw error;
      }
    });

    if (users.length === 0) {
      return { sent: 0, message: "No users to notify." };
    }

    // Send notifications in parallel
    const results = await step.run("send-all-notifications", async () => {
      return await Promise.allSettled(
        users.map((user) => {
          if (!user.email || !user.name) {
            return Promise.reject(
              new Error(`Invalid user data for user ${user._id}`)
            );
          }

          return sendEmail({
            to: user.email,
            subject: `🎬 New Show Added: ${movieTitle}`,
            body: `<div style="font-family: Arial, sans-serif; padding: 20px; line-height: 1.6;">
        <h2>Hi ${user.name},</h2>
        <p>We've just added a new show to our library:</p>
        <h3 style="color: #F84565;">"${movieTitle}"</h3>
        <p>Visit our website to explore and book your seats now!</p>
        
        <p style="margin-top: 20px;">
          Thanks,<br/>
          <strong>QuickShow Team</strong>
        </p>
      </div>`,
          });
        })
      );
    });

    const sent = results.filter((r) => r.status === "fulfilled").length;
    const failed = results.length - sent;

    console.log(
      `New show notifications: ${sent} sent, ${failed} failed out of ${results.length}`
    );

    return {
      sent,
      failed,
      message: `Notifications sent to ${sent} user(s), ${failed} failed.`,
    };
  }
);

// Export all Inngest functions
export const functions = [
  syncUserCreation,
  syncUserDeletion,
  syncUserUpdation,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotifications,
];