# Kasatria 3D Visualization Assignment

A submission for the **Kasatria Internship Preliminary Assignment**.

This project is an interactive 3D visualization dashboard that displays user data in various 3D layouts. The application features Google authentication, dynamic data loading from Google Sheets, and smooth 3D transitions between different visualization modes.

## Features Implemented

### Authentication
- **Google Login** using Google Identity Services
- Secure authentication flow with credential handling

### Data Management
- **Data loaded from Google Sheet** (CSV imported and shared with `lisa@kasatria.com`)
- Published CSV fetched client-side using **PapaParse**
- Real-time data parsing and rendering

### 3D Visualizations
- **Table Layout**: 20×10 grid arrangement
- **Sphere Layout**: Earth-like sphere with cards arranged from north pole to south pole, facing outward
- **Double Helix Layout**: DNA-style double helix structure
- **Grid Layout**: 5×4×10 three-dimensional grid

### Visual Features
- **Tiles colored by Net Worth**:
  - 🔴 **Red**: Net Worth < $100,000
  - 🟠 **Orange**: Net Worth $100,000–$200,000
  - 🟢 **Green**: Net Worth > $200,000
- **CSS3DRenderer-based 3D objects** replacing traditional periodic table elements
- **Neon-style border glow effects** with soft, diffused outer glow
- Smooth transitions between layout modes
- Interactive 3D camera controls (TrackballControls)

## Technologies Used

- **Vite** - Fast build tool and development server
- **Vanilla JavaScript** - Core application logic
- **Three.js** - 3D graphics library
- **CSS3DRenderer** - CSS-based 3D rendering for HTML elements
- **@tweenjs/tween.js** - Animation library (available, though custom transitions are implemented)
- **PapaParse** - CSV parsing library
- **Google Identity Services** - Google Sign-In integration
- **TrackballControls** - 3D camera interaction controls

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd kasatria-3d
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to the URL shown in the terminal (typically `http://localhost:5173`)

### Build for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

### Preview Production Build

```bash
npm run preview
```

## Deployment

This project is deployed on **Vercel**.

The application is configured for easy deployment:
- Connect your repository to Vercel
- Vercel will automatically detect Vite and configure the build settings
- The app will be live at your Vercel domain

## Configuration

### Google Sheets Setup

The application fetches data from a published Google Sheet CSV. To configure:

1. Update the `SHEET_CSV_URL` constant in `src/main.js` with your Google Sheet's published CSV URL
2. Ensure the sheet is shared with `lisa@kasatria.com` (or update the sharing settings)
3. The sheet should have the following columns:
   - Name
   - Country
   - Age
   - Interest
   - Net Worth
   - Photo (optional - URL to image)

### Google OAuth Setup

1. Update the `GOOGLE_CLIENT_ID` constant in `src/main.js` with your Google OAuth Client ID
2. Configure authorized JavaScript origins in Google Cloud Console

## Security Note

⚠️ **Important for Production**: In production environments, the Sheet should use authenticated Google Sheets API instead of public CSV for security. The current implementation uses a publicly accessible CSV URL, which is suitable for development and demonstration purposes but should be replaced with proper API authentication in production.

## Project Structure

```
kasatria-3d/
├── src/
│   ├── main.js          # Main application logic
│   ├── style.css        # Global styles
│   └── ...
├── index.html           # Main HTML file
├── package.json         # Dependencies and scripts
└── README.md           # This file
```

## Usage

1. **Login**: Sign in with your Google account
2. **Navigate**: Use the bottom navigation buttons to switch between layouts:
   - **TABLE**: Grid layout (20×10)
   - **SPHERE**: Spherical arrangement
   - **HELIX**: Double helix structure
   - **GRID**: 3D grid (5×4×10)
3. **Interact**: 
   - Rotate the view by clicking and dragging
   - Zoom with mouse wheel
   - Pan by right-clicking and dragging
   - Hover over cards to see enhanced glow effects

## License

This project is a submission for the Kasatria Internship Preliminary Assignment.

## Author

Created as part of the Kasatria Internship application process.

