# Art-Exhibition-Site

## Overview

This website is designed for simulating an art exhibition site. It efficiently handles managing and displaying art content. It focuses on modularity, scalability, and efficient data management, with an emphasis on a clean and modern user interface inspired by popular sites like Instagram and Dribbble.

## Important File Structure and Purpose

1. **Models.js**
   - **Purpose**: Handles database structuring for Artworks, Users, Reviews, and Workshops.
   - **Key Features**:
     - Schema Definitions
     - Relationship Establishment
     - Data Integrity and Searchability
     - Model Creation
     - Module Exporting

2. **Database-initializer.js**
   - **Purpose**: Automates MongoDB database population.
   - **Functionality**: Reads data from a JSON file and creates artist and artwork records.

3. **DatabaseHelpers.js**
   - **Purpose**: Provides asynchronous functions for database management.
   - **Functions**: Handle tasks like data retrieval, creation, updating, and deletion.

4. **Server.js**
    - **Purpose**: Manages all server actions for the site.

5. **ServerHelpers.js**
    - **Purpose**: Provides helper functions for database interactions.

## How To Run the Program

1. **Setup Environment**:
   - Navigate to the root folder.
   - Run `npm install` in the terminal to install dependencies.

2. **Initialize Database**:
   - Navigate to the database folder.
   - Run `node database-initializer.js` to populate the database.

3. **Start Server**:
   - Return to the root folder.
   - Run `node server.js` to start the server.

## Discussion and Critique of Design

### Key Design Principles:

- **Modularity and Scalability**: Organized file structure based on functional relationships, enhancing maintainability and future scalability.
- **Reusability**: Functions designed for versatility, aiding in application robustness.
- **Schema Design**: Focus on data integrity and consistent relationships, ensuring stable and efficient database structure.
- **REST API Best Practices**: Emphasis on intuitive and consistent naming conventions for user-friendly and navigable API design.

### Functionalities:

1. Handles authentication of users
2. Allows users to follow and unfollow artists
3. Allows users to review and like artworks
4. Allows artist to create workshops
5. Allows users to enroll and unenroll in workshops
6. Users receive notifications upon artwork creation and enrollment into workshop
