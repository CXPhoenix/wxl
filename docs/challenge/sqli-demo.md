---
title: "SQL Injection Demo"
layout: challenge
difficulty: easy
category: web
backend: flask
flag_verifier: "PLACEHOLDER_RUN_pnpm_challenge_keygen"
fs_key: "PLACEHOLDER_RUN_pnpm_challenge_keygen"
source_visible: false
app: ./sqli-demo/app.py
fs:
  /flag.txt: ./sqli-demo/flag.txt
description: >
  A simple Flask app with a SQL injection vulnerability.
  Can you retrieve all users from the database?
---

# SQL Injection Demo

A login form backed by SQLite. Find a way to bypass authentication and retrieve the flag.
