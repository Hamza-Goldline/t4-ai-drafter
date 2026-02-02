# How to Create a Release and Update T4 Ai Drafter

This document explains how to build the `.exe` installer for your application and how to release updates so users get them automatically.

## Prerequisites

1.  **GitHub Account**: You need a GitHub account.
2.  **GitHub Repository**: You need a repository for this project.
3.  **GitHub Token (GH_TOKEN)**: You need a Personal Access Token to upload releases.

---

## Step 1: Set up GitHub Repository

1.  Go to [GitHub.com](https://github.com) and create a new repository (e.g., `t4-ai-drafter`).
2.  **Crucial**: Make sure the repository name matches what you put in `package.json`.
3.  Open `package.json` in your code editor.
4.  Find the `"build"` section and update `"owner"` and `"repo"`:
    ```json
    "publish": [
      {
        "provider": "github",
        "owner": "YOUR_GITHUB_USERNAME", // e.g., "hamzanawaz"
        "repo": "YOUR_REPO_NAME"       // e.g., "t4-ai-drafter"
      }
    ]
    ```

## Step 2: Generate a GitHub Token

1.  Go to **Settings** > **Developer settings** > **Personal access tokens** > **Tokens (classic)**.
2.  Click **Generate new token (classic)**.
3.  Give it a name (e.g., "Electron Builder").
4.  **Select Scopes**: Check the `repo` box (Full control of private repositories). This is required to upload files.
5.  Click **Generate token**.
6.  **Copy the token immediately**. You won't see it again.

## Step 3: Build and Release

To build the installer and upload it to GitHub, you need to run the build command with your token.

### Option A: PowerShell (Windows)

Run this command in your terminal (replace `YOUR_TOKEN_HERE` with your actual token):

```powershell
$env:GH_TOKEN="YOUR_TOKEN_HERE"; npm run dist
```

### Option B: Command Prompt (cmd)

```cmd
set GH_TOKEN=YOUR_TOKEN_HERE && npm run dist
```

### What happens next?

1.  `electron-builder` will package your app into an `.exe` file (located in the `dist` folder).
2.  It will automatically create a **Draft Release** on your GitHub repository.
3.  It will upload the `.exe` and `latest.yml` (update info) to that release.

## Step 4: Publish the Release

1.  Go to your GitHub repository > **Releases**.
2.  You will see a new "Draft" release corresponding to your version (e.g., v1.0.0).
3.  Click **Edit** (pencil icon).
4.  Review the release notes.
5.  Click **Publish release**.

**That's it!** Users can now download the `.exe` from the release page.

---

## How Auto-Updates Work

When you want to release an update (e.g., v1.0.1):

1.  **Update Version**: Open `package.json` and increase the version number (e.g., change `"1.0.0"` to `"1.0.1"`).
2.  **Run Build**: Run the build command again:
    ```powershell
    $env:GH_TOKEN="YOUR_TOKEN_HERE"; npm run dist
    ```
3.  **Publish**: Go to GitHub Releases and publish the new draft.

**The Magic**:
*   Users who have v1.0.0 installed will open the app.
*   The app will quietly check GitHub for `latest.yml`.
*   It sees `v1.0.1` is available.
*   It downloads the update in the background.
*   Next time the user restarts the app, it will be updated to v1.0.1 automatically!
