# MobileMediaInteractions Website Structure Guide

## Introduction

The MobileMediaInteractions website is a modern platform designed to showcase the company’s **projects**, **collaborations**, and **announcements**. It prioritizes a clean, responsive design to engage users across devices while providing an accessible and visually appealing experience.

---

## Header

The header is fixed at the top of the page and includes:

- **Logo**: Displays "MMI" in a bold, primary color to reinforce brand identity.
- **Theme Toggle**: A switch enabling users to alternate between light and dark modes, with the preference saved in local storage for consistency across visits.

---

## Hero Section

The hero section introduces the site:

- **Heading**: "MobileMediaInteractions".
- **Subheading**: "Innovating Entertainment, Building Experiences—From Apps to Podcasts to the Future of Television."
- **Background**: Features a gradient with subtle animations to create visual interest.

---

## Content Sections

The main content is organized into three sections within a flexible container, dynamically populated from `projects.json`:

### 1. Projects
- **Purpose**: Highlights current and past projects.
- **Content**: Each project card displays the title, status badge, description, and an optional link.
- **Order**: Always appears first, as it’s the core focus of the site.

### 2. Collaborations
- **Purpose**: Showcases partnerships with other entities.
- **Content**: Cards include the collaboration name, summary, status, and an optional link.
- **Order**: Appears second if data exists; otherwise, it shifts to the bottom.

### 3. Announcements
- **Purpose**: Teases upcoming events or releases.
- **Content**: Cards feature the name, summary, status, and custom buttons defined in the `data` field.
- **Order**: Appears third if data is present; otherwise, it moves to the bottom.

**Dynamic Ordering**:
- Sections are prioritized as Projects > Collaborations > Announcements based on data availability.
- Empty sections are automatically relegated to the bottom to keep relevant content prominent.

---

## Footer

The footer is simple and includes:

- **Copyright Notice**: "© 2018 - 2025 MobileMediaInteractions. All Rights Reserved."

---

## Theme Toggle

- **Functionality**: Users can switch between light and dark modes via the header toggle.
- **Effect**: Adjusts the site’s color scheme for readability and comfort.
- **Persistence**: The chosen theme is stored locally and reapplied on subsequent visits.

---

## Responsiveness

The site adapts seamlessly to all screen sizes:

- **Mobile Layout**: Sections stack vertically, with adjusted font sizes for readability.
- **Grid Adaptation**: Multi-column layouts for projects, collaborations, and announcements collapse to single columns on smaller screens.
- **Accessibility**: Supports keyboard navigation and maintains sufficient contrast in both themes.

---

## Additional Notes

- **Data Integration**: Content is sourced from `projects.json`, allowing easy updates without altering the site’s code.
- **Design Features**: Includes subtle shadows, hover effects, and smooth transitions for a polished look.
- **Maintenance**: The dynamic ordering and responsive design minimize the need for manual layout adjustments.

This structure ensures the MobileMediaInteractions website is both functional and engaging, providing a solid foundation for showcasing the company’s work.

---
