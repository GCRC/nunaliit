# Prerequisites: Ubuntu 24.04

This document describes the recommended prerequisites for running Nunaliit on **Ubuntu 24.04 (Noble Numbat)**.

## Overview

The recommended environment is:

- **Operating System:** Ubuntu 24.04 LTS
- **Java Runtime:** OpenJDK 24
- **Database:** Apache CouchDB 3.5.x

> Note: Nunaliit requires **Java 11 or newer** at runtime. OpenJDK 24 is recommended for Ubuntu 24.04.

> These commands assume you have administrator privileges. If `sudo` is unavailable in your environment, run them from a root shell (e.g., `su -`) or use your system's approved privilege escalation method.

---


## Install OpenJDK 24

Update package lists:

```bash
sudo apt update