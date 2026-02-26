# Firebase (Firestore NoSQL) setup

This project can run fully static, but to enable:
- Lưu RSVP vào DB
- Admin page (login, list, export Excel)

…you need Firebase.

## 1) Create Firebase project
- Go to Firebase Console and create a project.
- Add a Web app.

## 2) Enable Firestore
- Build → Firestore Database → Create database.

Collections used by this site:
- `guests/{token}`: created by admin in `admin.html`
- `rsvps/{token}`: written by guests when submitting RSVP

## 3) Enable admin login
- Build → Authentication → Sign-in method → enable **Email/Password**.
- Create an admin user in Authentication → Users.

## 4) Put config into the site
Edit `firebase-config.js` and fill:
- `apiKey`, `authDomain`, `projectId`, `appId`, …

## 5) Apply Security Rules
Use the sample rules in `firestore.rules`.

Important: update the admin UID list inside `firestore.rules` (search for `REPLACE_WITH_ADMIN_UID`).
You can find the UID in Firebase Console → Authentication → Users.

Alternative (recommended for easier admin management):
- Deploy the updated `firestore.rules`
- In Firestore, create a document `admins/<your-uid>` (can be empty)
- After that, `isAdmin()` will allow that UID without hard-coding it in rules

## 6) Use
- Admin page: `/admin.html`
- Generate a guest link → send it to each guest
- Guests submit RSVP on the invite page (requires `t=<token>` in the URL)

## Deploy
- Deploy rules: `firebase deploy --only firestore:rules`
- Deploy hosting: `firebase deploy --only hosting`

## Troubleshooting: “Missing or insufficient permissions”
If Admin page shows `Missing or insufficient permissions.` when creating a guest link or loading lists:

1) Make sure your admin UID is added in `firestore.rules` → `isAdmin()` list (in quotes).

2) Ensure you deployed rules to the SAME Firebase project as your `firebase-config.js`:
- Login CLI: `firebase login`
- (Optional) verify/choose project: `firebase use --add`
- Deploy rules: `firebase deploy --only firestore:rules`

3) Confirm you are logged in on `/admin.html` (it should show your UID).

## URL format
Example:
- `index.html?guest=Nguyen%20Van%20A&t=AbC123xyZ9&side=nhatrai`
