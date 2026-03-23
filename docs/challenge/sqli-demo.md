---
title: "SQL Injection Demo"
layout: challenge
difficulty: easy
category: web
backend: flask
source_visible: false
app: ./sqli-demo/app.py
fs:
  /flag.txt: ./sqli-demo/flag.txt
description: >
  A simple Flask app with a SQL injection vulnerability. Can you retrieve all users from the database?
wasmModule: /challenge/sqli-demo/runtime.wasm
---

# SQL Injection Demo

A login form backed by SQLite. Find a way to bypass authentication and retrieve the flag.
