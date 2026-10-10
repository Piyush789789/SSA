# SSA School ERP — Android apps

Four separate apps, one per role, built with React Native + Expo (SDK 57). They all talk to the
Spring Boot backend in `../backend`.

| App | Folder | Android package | For |
|---|---|---|---|
| SSA Student | `apps/student` | `com.ssa.erp.student` | Dashboard, attendance, results, fees, homework, timetable, study materials, notices, messages |
| SSA Parent | `apps/parent` | `com.ssa.erp.parent` | The same for each child, with a child switcher |
| SSA Teacher | `apps/teacher` | `com.ssa.erp.teacher` | Mark attendance, enter marks, assign homework, post notices, message classes/families |
| SSA Admin | `apps/admin` | `com.ssa.erp.admin` | School dashboard, student records, collect fees, publish exam results, notices |

Code shared by all four (login, API client, theme, common screens) is in `packages/shared`.
Each app's screens are files under `apps/<app>/src/app` (Expo Router: one file = one screen).

## Run on your phone (development)

1. Install **Expo Go** from the Play Store on your Android phone.
2. Start the backend (`cd backend` then `.\mvnw.cmd spring-boot:run`).
3. Put the phone and the computer on the **same Wi-Fi**.
4. Install and start an app:

   ```powershell
   cd APP
   npm install        # first time only
   npm run student    # or: npm run parent / npm run teacher / npm run admin
   ```

5. Scan the QR code with Expo Go. Sign in with the demo account shown on the login screen.

The apps use port **8082** for the dev server, because the PostgreSQL installer's Apache web server (PEMHTTPD) already uses 8081 on this PC. Only one app can run at a time; stop one (Ctrl+C) before starting another.

### The app can't reach the server?

The app uses the computer that runs the Expo dev server as the backend address
(`http://<that computer's IP>:8080/api`, shown at the bottom of the login screen).

- **Windows Firewall** must allow incoming connections to the backend. In an *administrator* PowerShell:
  `New-NetFirewallRule -DisplayName "SSA backend 8080" -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow -Profile Private`
  (and make sure your Wi-Fi network is set to *Private*).
- **Android emulator** or a different backend address: create `apps/<app>/.env` with
  `EXPO_PUBLIC_API_URL=http://10.0.2.2:8080/api` (emulator) or your server's address, then restart with `npx expo start --clear`.

## Build an installable APK

- **Locally** (uses your installed Android Studio/SDK): `cd apps/student` then `npx expo run:android --variant release`.
- **In the cloud** with EAS: `npx eas-cli@latest build -p android --profile preview` (needs a free Expo account).

Installed APKs are not connected to the dev server, so set `EXPO_PUBLIC_API_URL` in the app's `.env`
to the backend's address before building. Plain `http://` is allowed (see `expo-build-properties` in
`app.json`); use HTTPS before publishing to the Play Store.

## Demo accounts

| Role | Email | Password |
|---|---|---|
| Student | student@ssa.edu | student123 |
| Parent | parent@ssa.edu | parent123 |
| Teacher | teacher@ssa.edu | teacher123 |
| Admin | admin@ssa.edu | admin123 |

Each app only accepts accounts of its own role.

## Adding packages

Always add native/Expo packages with `npx expo install <package>` inside the app folder, so the version
matches Expo SDK 57. Keep the four apps on the same versions.
