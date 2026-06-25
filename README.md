YaataYaat 🚕

A ride-booking web app UI with a complete end-to-end booking flow — search a ride, view a route map, review a matched driver, and complete checkout. Includes a manual dark mode toggle throughout.

Features


Ride search — enter pickup and drop-off location to find available rides
Route map — visual map view showing the route between pickup and destination
Driver card — displays matched driver's name, star rating, and vehicle details before confirming
Checkout flow — review ride summary and confirm booking
Dark mode — manual toggle switches the entire UI between light and dark themes


Screens

ScreenDescriptionLoginUser login page with light and dark variantsHomeRide search — enter pickup and drop locationMap viewRoute map between pickup and destinationReserveDriver card with name, rating, and vehicle infoCheckoutBooking summary and confirmation

Tech Stack


HTML5
CSS3 (custom light/dark theming)
Vanilla JavaScript



This is a frontend prototype. There is no backend or live database — all interactions are UI-only.



Getting Started

No build step needed. Just open any .html file directly in your browser.

bash git clone https://github.com/ananyajaiswal2810/yaatayaat.git
cd yaatayaat
open home.html    # or double-click in your file explorer

To start from the login screen:

bashopen login.html

Dark Mode

Each page has a manual toggle button that switches between light and dark themes. Dark variants are implemented as separate HTML files (login_dark.html, page_dark.html, reserve_dark.html, map_dark.html) for clean separation of styles.

Project Structure

├── login.html / login_dark.html       # Login screen
├── home.html                          # Ride search
├── page.html / page_dark.html         # Map + route view
├── reserve.html / reserve_dark.html   # Driver card + ride details
├── map.png / map_dark.png             # Route map assets
├── cab-icon.png                       # UI assets

Author

Ananya Jaiswal — github.com/ananyajaiswal2810 
