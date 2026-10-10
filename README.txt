MEDICARE - MEDICINE REMINDER PLATFORM (FRONTEND DEMO)

HOW TO RUN IN VS CODE
1. Download and extract medicine_reminder_platform.zip.
2. Open the extracted folder in Visual Studio Code.
3. Open index.html in your browser.
   Recommended: install the VS Code extension "Live Server", right-click index.html, and choose "Open with Live Server".

FEATURES INCLUDED
- Dashboard overview
- Add, edit, and delete medicines
- Dose schedule with Taken, Late, and Missed actions
- Local medicine history and adherence score
- Estimated medicine run-out date based on stock and daily use
- Low-stock indicators
- Caregiver details and demo escalation settings
- Browser notification permission request
- Responsive layout for mobile and desktop
- Uses browser localStorage, so demo data stays in that browser

IMPORTANT LIMITATIONS
- This is a frontend prototype, not a production healthcare system.
- Data is stored only in the current browser. It is not synced between devices and there is no user authentication/backend/database yet.
- Real background push reminders, caregiver email/SMS alerts, and dependable escalation while the browser is closed require a backend scheduler and connected notification service.
- Marking a dose as taken or late reduces stock by one unit in this demo. Adjust app.js if you need different stock rules.
- Do not use this prototype as a replacement for medical advice. Follow the medicine instructions given by your healthcare professional.

NEXT STEP
When the frontend works, you can add a Python Flask backend and MySQL database for accounts, medicine records, schedules, dose logs, and caregiver settings.
