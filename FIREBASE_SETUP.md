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

## 6) Use
- Admin page: `/admin.html`
- Generate a guest link → send it to each guest
- Guests submit RSVP on the invite page (requires `t=<token>` in the URL)

## Deploy
- Deploy rules: `firebase deploy --only firestore:rules`
- Deploy hosting: `firebase deploy --only hosting`

## URL format
Example:
- `index.html?guest=Nguyen%20Van%20A&t=AbC123xyZ9&side=nhatrai`
