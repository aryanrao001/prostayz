# GoROAM - Build Your APK

## Step-by-step APK generation

### 1. Install EAS CLI (one-time, on your laptop)
```bash
npm install -g eas-cli
```

### 2. Clone the source code
Either download the ZIP from the Emergent code editor (see below) or push to GitHub from Emergent and clone.

```bash
cd frontend
yarn install
```

### 3. Create a free Expo account
Visit https://expo.dev and sign up (free tier allows APK builds).

### 4. Login from terminal
```bash
eas login
```

### 5. Point the project to your Expo account (one-time)
```bash
eas init --id <it will auto-create a project id for you>
```
Or just run the build command below and accept the prompts — EAS will create the project automatically.

### 6. Build the APK
```bash
eas build --platform android --profile preview
```

This:
- Uploads your code to Expo's build servers
- Builds a debug-signed APK (takes ~10-20 min on free tier)
- Gives you a download link and QR code at the end
- APK is directly installable on any Android phone

### 7. Download and install
- Open the link EAS gives you → download the `.apk`
- Transfer to your Android phone
- Enable "Install from unknown sources" in phone settings
- Tap the APK to install

---

## IMPORTANT: Backend Configuration

Before building, update `/app/frontend/.env`:
```
EXPO_PUBLIC_BACKEND_URL=<your-deployed-backend-url>
```

Because the APK runs on a user's phone, it cannot reach `localhost` or the Emergent preview URL. You need to deploy the backend first. Options:
- **Emergent native deployment** (click Deploy button in Emergent chat)
- **Railway / Render / Fly.io** (free tiers available)
- **Your own server**

After deployment, put that public URL in `.env` and rebuild the APK.

---

## Build Profiles Explained
- **preview** (our default): installable APK for testing, internal distribution
- **production**: Google Play Store bundle (`.aab`) with auto-incrementing version

Switch with `--profile production` when ready for Play Store.

---

## Pre-flight checklist
- [x] `app.json` has `android.package` set to `com.goroam.app`
- [x] `eas.json` included with preview + production profiles
- [x] App icon and splash icon present in `assets/images/`
- [ ] Backend deployed and URL updated in `.env`
- [ ] Tested on preview URL
