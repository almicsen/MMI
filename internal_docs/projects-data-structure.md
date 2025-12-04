# projects.json Structure Guide

## Introduction

The `projects.json` file serves as the central data source for the MobileMediaInteractions website. It stores structured information about the company's **projects**, **announcements**, and **collaborations**, enabling the site to dynamically display up-to-date content in its respective sections. This guide details how to structure the JSON file, including all necessary fields and their purposes, to ensure compatibility with the website's functionality.

---

## Structure Overview

The `projects.json` file is divided into three primary sections, each represented as an array of objects:

- **projects**: Contains details about completed or ongoing projects undertaken by MobileMediaInteractions.
- **announcements**: Holds information about upcoming events, releases, or teasers to be showcased on the site.
- **collaborations**: Lists partnerships or joint ventures with other organizations or entities.

Each object within these arrays represents a single item (e.g., a project, an announcement, or a collaboration) and includes specific fields to describe its attributes.

---

## Projects Section

The `projects` section contains objects representing individual projects. Each object should include the following fields:

- **title** (string): The name of the project.
  - *Example*: `"Trivia Time Live"`
  - *Purpose*: Identifies the project on the website.
- **description** (string): A concise summary of the project.
  - *Example*: `"An interactive live trivia experience that engages users through competition."`
  - *Purpose*: Provides context for visitors.
- **status** (string): The current state of the project.
  - *Possible Values*: `"active"`, `"archived"`, `"development"`
  - *Purpose*: Indicates whether the project is ongoing, completed, or in progress.
- **startDate** (string): The project's start date in `"YYYY-MM-DD"` format.
  - *Example*: `"2023-01-01"`
  - *Purpose*: Tracks when the project began.
- **endDate** (string, optional): The project's end date in `"YYYY-MM-DD"` format; set to `null` or omit if ongoing.
  - *Example*: `"2023-12-31"` or `null`
  - *Purpose*: Marks the completion date, if applicable.
- **link** (string, optional): A URL linking to the project’s page or external site.
  - *Example*: `"https://example.com/trivia-time"`
  - *Purpose*: Directs users to additional information.
- **externalClients** (boolean): Indicates if the project involved external clients.
  - *Example*: `true` or `false`
  - *Purpose*: Highlights collaboration with outside parties.

---

## Announcements Section

The `announcements` section contains objects for upcoming events or releases. Each object should include:

- **name** (string): The title of the announcement.
  - *Example*: `"New Trivia Show Launch"`
  - *Purpose*: Serves as the headline on the site.
- **summary** (string): A brief description of the announcement.
  - *Example*: `"Get ready for an exciting trivia show launching on NBC in 2025!"`
  - *Purpose*: Teases the upcoming content.
- **collaborator** (string, optional): The name of any collaborator involved.
  - *Example*: `"NBC"`
  - *Purpose*: Credits partners, if applicable.
- **startDate** (string, optional): The date the announcement goes live, in `"YYYY-MM-DD"` format.
  - *Example*: `"2025-01-01"`
  - *Purpose*: Schedules when it appears on the site.
- **status** (string): The announcement’s status, typically `"announced"`.
  - *Example*: `"announced"`
  - *Purpose*: Differentiates it from active projects or collaborations.
- **link** (string, optional): A URL for more details.
  - *Example*: `"https://NBC.com/announcement"`
  - *Purpose*: Provides additional resources.
- **logo** (string, optional): A URL to an image logo associated with the announcement.
  - *Example*: `"https://NBC.com/logo.png"`
  - *Purpose*: Enhances visual appeal.
- **isActive** (boolean): Determines if the announcement is displayed on the site.
  - *Example*: `true`
  - *Purpose*: Toggles visibility.
- **changeKeys** (array of strings): Lists fields that differ from base data (used for linking with collaborations).
  - *Example*: `["summary", "data"]`
  - *Purpose*: Facilitates data overrides.
- **data** (array of objects): Defines custom buttons, each with:
  - **text** (string): Button label.
    - *Example*: `"Stay Tuned"`
  - **link** (string): URL the button links to (or `null`).
    - *Example*: `null`
  - **isClickable** (boolean): Whether the button is interactive.
    - *Example*: `false`
  - *Purpose*: Adds interactive elements to announcements.

---

## Collaborations Section

The `collaborations` section details partnerships. Each object should include:

- **name** (string): The name of the collaboration.
  - *Example*: `"NBC Partnership"`
  - *Purpose*: Identifies the partnership.
- **summary** (string): A description of the collaboration.
  - *Example*: `"Working with NBC to create innovative media solutions."`
  - *Purpose*: Explains the collaboration’s goals.
- **collaborator** (string): The name of the collaborating entity.
  - *Example*: `"NBC"`
  - *Purpose*: Credits the partner.
- **startDate** (string): The collaboration’s start date in `"YYYY-MM-DD"` format.
  - *Example*: `"2024-01-01"`
  - *Purpose*: Tracks the partnership timeline.
- **status** (string): The current status.
  - *Possible Values*: `"active"`, `"announced"`
  - *Purpose*: Indicates the partnership’s state.
- **link** (string, optional): A URL for more details.
  - *Example*: `"https://NBC.com"`
  - *Purpose*: Links to external info.
- **logo** (string, optional): A URL to the collaborator’s logo.
  - *Example*: `"https://NBC.com/logo.png"`
  - *Purpose*: Adds branding.
- **isActive** (boolean): Determines if the collaboration is displayed.
  - *Example*: `true`
  - *Purpose*: Controls visibility.
- **changeKeys** (array of strings): Lists overridden fields from base data.
  - *Example*: `[]`
  - *Purpose*: Supports data customization.
- **data** (array of objects): Custom button definitions (same structure as in announcements).
  - *Example*: `[{"text": "Learn More", "link": "https://NBC.com", "isClickable": true}]`
  - *Purpose*: Enhances interactivity.

---

## Example JSON Structure

Here’s a sample `projects.json` file with dummy data:

```json
{
  "projects": [
    {
      "title": "Trivia Time Live",
      "description": "An interactive live trivia experience.",
      "status": "archived",
      "startDate": "2020-09-03",
      "endDate": "2021-07-20",
      "link": null,
      "externalClients": false
    }
  ],
  "announcements": [
    {
      "name": "New Trivia Show Launch",
      "summary": "Get ready for an exciting trivia show launching on NBC in 2025!",
      "collaborator": "NBC",
      "startDate": "2025-01-01",
      "status": "announced",
      "link": null,
      "logo": null,
      "isActive": true,
      "changeKeys": ["summary", "data"],
      "data": [
        {
          "text": "Stay Tuned",
          "link": null,
          "isClickable": false
        }
      ]
    }
  ],
  "collaborations": [
    {
      "name": "NBC Partnership",
      "summary": "Working with NBC to create innovative media solutions.",
      "collaborator": "NBC",
      "startDate": "2024-01-01",
      "status": "active",
      "link": "https://NBC.com",
      "logo": "https://NBC.com/logo.png",
      "isActive": true,
      "changeKeys": [],
      "data": [
        {
          "text": "Learn More",
          "link": "https://NBC.com",
          "isClickable": true
        }
      ]
    }
  ]
}