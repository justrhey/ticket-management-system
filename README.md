
---

# Ticket Management System

A lightweight and efficient ticket dashboard system built with **Spring Boot (Java)** and **vanilla JavaScript**.
Designed for single-account access, it offers real-time monitoring, email alerts, and sound notifications through a simple yet responsive interface.

![Java](https://img.shields.io/badge/Java-17%2B-orange?style=for-the-badge\&logo=java)
![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.0%2B-brightgreen?style=for-the-badge\&logo=springboot)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6%2B-yellow?style=for-the-badge\&logo=javascript)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15%2B-blue?style=for-the-badge\&logo=postgresql)
![Docker](https://img.shields.io/badge/Docker-Compose-blue?style=for-the-badge\&logo=docker)

---

## Overview

This project is a simple internal tool for managing tickets with a single dashboard.
It includes essential ticket CRUD operations, live updates, and notifications without user management complexity.

---

## Screenshot

<img width="1898" height="1016" alt="2025-10-19-194330_hyprshot" src="https://github.com/user-attachments/assets/fc64956f-f2ff-4868-a9b9-fd8704cc868d" />


<img width="1920" height="1080" alt="2025-10-27-114001_hyprshot" src="https://github.com/user-attachments/assets/4d825dd1-112f-4025-b7a8-a986a0dd2be5" />


---


## Features

* Single admin dashboard
* Real-time ticket monitoring
* Email notifications
* Sound-based alerts
* Responsive layout
* Docker-ready deployment

---

## System Architecture

```mermaid
flowchart TD
    subgraph Frontend
        A[HTML5 + Vanilla JS] --> B[CSS3 Styling]
        A --> C[Fetch API Requests]
    end

    subgraph Backend
        D[Spring Boot REST API] --> E[Service Layer]
        E --> F[JPA Repository]
        F --> G[PostgreSQL Database]
        E --> H[Notification Service]
    end

    C <--> D
```

---

## Technology Stack

| Layer      | Technology              |
| ---------- | ----------------------- |
| Backend    | Java 17+, Spring Boot 3 |
| Database   | PostgreSQL 15+          |
| Frontend   | HTML5, CSS3, JavaScript |
| Container  | Docker, Docker Compose  |
| Build Tool | Maven                   |

---

## Setup

### Docker Compose

```bash
docker-compose up --build
```

### Manual Run

```bash
git clone https://github.com/justrhey/ticket-management-system.git
cd ticket-management-system
mvn clean install
mvn spring-boot:run
```

### Database

```sql
CREATE DATABASE ticketdb;
CREATE USER ticketuser WITH PASSWORD 'securepassword';
GRANT ALL PRIVILEGES ON DATABASE ticketdb TO ticketuser;
```

---

## API Overview

| Method | Endpoint            | Description       |
| ------ | ------------------- | ----------------- |
| GET    | `/api/tickets`      | Fetch all tickets |
| POST   | `/api/tickets`      | Create a ticket   |
| PUT    | `/api/tickets/{id}` | Update a ticket   |
| DELETE | `/api/tickets/{id}` | Delete a ticket   |

---

## Example Request

```bash
curl -X POST http://localhost:8080/api/tickets \
  -H "Content-Type: application/json" \
  -d '{"subject":"Issue","fullName":"User","intent":"System Error","priority":"HIGH"}'
```

---

## Acknowledgments

* Spring Boot and PostgreSQL community
* Virspacio Co-Working Space IT Dept (concept origin)
* Reference: user-registration-service

---

<div align="center">

**Made by [justrhey](https://github.com/justrhey)**
[Back to Top](#ticket-management-system)

</div>
