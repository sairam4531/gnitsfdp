# FDP on Smart Data Visualization using Power BI — GNITS

One Week Faculty Development Program (FDP) on **Smart Data Visualization using Power BI with Prompt Engineering and Generative AI** at G. Narayanamma Institute of Technology and Science (GNITS), Hyderabad.

<!-- Trigger Vercel Build -->

## Deployed URL

- **Frontend Link (Vercel):** [https://gnitsfdp.vercel.app/](https://gnitsfdp.vercel.app/)

---

## Code Configurations

1. **Dynamic Redirections:**
   The authentication redirects are dynamically generated in the codebase using `window.location.origin` (for example, in [auth.tsx](file:///d:/New%20folder/Documents/Downloads/gnitsfdp/gnitsfdp/src/routes/auth.tsx)). This ensures that:
   - During **Local Development**, redirects point to `http://localhost:5173`.
   - On **Production (Vercel)**, redirects automatically point to `https://gnitsfdp.vercel.app`.

2. **Environment Variables:**
   The deployed frontend URL is configured in [.env](file:///d:/New%20folder/Documents/Downloads/gnitsfdp/gnitsfdp/.env):

   ```env
   # Frontend Deployed URL
   VITE_SITE_URL="https://gnitsfdp.vercel.app"
   FRONTEND_URL="https://gnitsfdp.vercel.app"
   ```

3. **SEO and Open Graph Metadata:**
   The root layout [\_\_root.tsx](file:///d:/New%20folder/Documents/Downloads/gnitsfdp/gnitsfdp/src/routes/__root.tsx) includes updated search engine titles, descriptions, and Open Graph tags pointing to `https://gnitsfdp.vercel.app/`.

---

## Required Supabase Configuration

To ensure that email verifications, passwords resets, and sign-up flows redirect users back to your deployed Vercel app, you **must** configure the URL settings in your Supabase Dashboard:

1. Go to the **[Supabase Dashboard](https://supabase.com/dashboard)**.
2. Select your project: `qwnycqjgrgygpivoybfx`.
3. In the left sidebar, navigate to **Authentication** -> **URL Configuration**.
4. Set the **Site URL** to:
   ```
   https://gnitsfdp.vercel.app
   ```
5. In the **Redirect URLs** section, add the following wildcard patterns:
   ```
   https://gnitsfdp.vercel.app/**
   https://gnitsfdp.vercel.app/admin
   ```
6. Save the settings.

---

## Local Development

To run the application locally:

```bash
# Install dependencies
bun install   # or npm install

# Run the development server
bun dev       # or npm run dev
```
