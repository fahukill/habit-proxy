module.exports = function generateWelcomeEmail({ firstName = "there" }) {
  return {
    subject: "👋 Welcome to HabitSyncAI!",
    html: `
        <div style="font-family: Inter, sans-serif; background-color: #111111; color: #FAFAF5; padding: 24px; border-radius: 12px;">
          <h1 style="font-family: Montserrat, sans-serif; color: #1CA2A2;">Welcome, ${firstName}!</h1>
          <p>Thanks for joining <strong>HabitSyncAI</strong> — your new home for building consistent, meaningful habits with the power of AI.</p>
          <p>We’re here to help you stay on track, grow stronger habits, and hit your goals with confidence.</p>
          <p style="margin-top: 20px;">✨ Let's do this — one habit at a time.</p>
          <p style="margin-top: 24px;">— The HabitSyncAI Team</p>
        </div>
      `,
  };
};
