# Thrust 5.0 — Live Leaderboard & Judging Portal

Live Leaderboard and Judging Portal for **Thrust 5.0**, hosted by the **Aero Fabrication Club (AFC)**.

## Tech Stack

- **Framework**: [React](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) + Custom aerospace design tokens
- **Animations**: [Framer Motion](https://www.framer.com/motion/)
- **Backend / Realtime**: [Supabase](https://supabase.com/) & Google Sheets live sync
- **Icons**: [Lucide React](https://lucide.dev/)
- **Virtualization**: [@tanstack/react-virtual](https://tanstack.com/virtual/latest)

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/lakshhn/thrust5.0.git
cd thrust5.0

# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Variables

Copy `.env.example` to `.env.local` and configure:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_USERNAME=afc
VITE_ADMIN_PASSWORD_HASH=your_sha256_hash
```

### Build

```bash
npm run build
```
