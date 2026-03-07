# 🎓 KCSE Course Checker

> Helping Kenyan students discover the university and diploma courses they qualify for — based on their real KCSE grades and 2024 KUCCPS cutoff points.

🌐 **Live App:** [course-compass-one.vercel.app](https://course-compass-one.vercel.app)

---

## 📱 What It Does

Every year, thousands of Kenyan Form 4 leavers struggle to know which university courses they qualify for. This tool solves that.

**Enter your KCSE grades → get your cluster scores → see every course you qualify for.**

### Features
- ✅ Automatic cluster score calculation using the official KUCCPS formula
- ✅ 393 courses — 291 degrees + 102 diplomas with exact 2024 KUCCPS cutoff points
- ✅ Interest-based filtering — only see courses in fields you care about
- ✅ M-Pesa STK Push payment via IntaSend (secure backend verification)
- ✅ Google OAuth — sign in once, retrieve results anytime without re-paying
- ✅ Diploma-only mode — automatically detected for students below C+
- ✅ Returning user flow — retrieve previous results by name and phone
- ✅ Installable as a PWA — works like a native app on Android and iPhone
- ✅ 2024 KUCCPS official cutoff points PDF embedded for verification
- ✅ WhatsApp support button for direct student assistance

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript |
| Styling | Tailwind CSS + shadcn/ui |
| Backend / Database | Supabase (PostgreSQL + RLS) |
| Auth | Supabase Google OAuth |
| Payments | IntaSend M-Pesa STK Push |
| Serverless Functions | Supabase Edge Functions (Deno) |
| PWA | vite-plugin-pwa + Workbox |
| Deployment | Vercel |
| Build Tool | Vite + SWC |

---

## 🏗️ Architecture

```
User enters KCSE grades
        ↓
Cluster engine calculates scores (calibrated to 2024 KUCCPS data)
        ↓
matchCoursesWithCutoffs() → ranked list of qualifying courses
        ↓
M-Pesa STK Push (IntaSend) → Edge Function → Supabase payments table
        ↓
mpesa-callback Edge Function verifies payment server-side
        ↓
Frontend polls DB for confirmed status → unlocks results
```

**Payment flow is fully secure** — access is only granted after the backend Edge Function confirms the transaction from IntaSend's webhook. The frontend never grants itself access.

---

## 🗄️ Database Tables

| Table | Purpose |
|---|---|
| `users` | Student profiles (name, gender, age, phone) |
| `user_results` | KCSE subject grades per student |
| `user_cluster_results` | Calculated cluster scores |
| `payments` | M-Pesa payment records with status |
| `courses` | 393 courses with cutoff points |
| `degree_programme_cutoffs_exact_2024` | 703 exact 2024 KUCCPS cutoffs |
| `reviews` | Student reviews (admin-approved before display) |

---

## ⚙️ Cluster Score Formula

```
C = √((r/48) × (t/84)) × 48 × 0.957
```

Where `r` = raw cluster subject score (max 48) and `t` = KCSE aggregate (max 84).
Calibrated to match 2024 KUCCPS placement data.

---

## 🚀 Getting Started (Local Development)

```bash
# Clone the repo
git clone https://github.com/gitau254-m/course-compass.git
cd course-compass

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Fill in your Supabase URL and anon key

# Start dev server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
```

---

## 📦 Edge Functions

| Function | Purpose |
|---|---|
| `intasend-stk` | Initiates M-Pesa STK Push, creates payment record |
| `mpesa-callback` | Receives IntaSend webhook, verifies and confirms payment |
| `intasend-webhook` | Secondary webhook handler |

---

## 👨‍💻 Author

**Wallace Gitau**
- LinkedIn: [linkedin.com/in/wallace-gitau-0054b737b](https://linkedin.com/in/wallace-gitau-0054b737b)
- GitHub: [@gitau254-m](https://github.com/gitau254-m)
- WhatsApp Support: [Chat with us](https://wa.me/254103837257)

---

## 📄 License

MIT License — feel free to fork and build on this.

---

> Built with ❤️ for Kenyan students navigating university admissions.
