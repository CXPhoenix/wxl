---
title: "PHP File Inclusion Demo"
layout: challenge
difficulty: easy
category: web
backend: php
flag_verifier: "PLACEHOLDER_RUN_pnpm_challenge_keygen"
fs_key: "PLACEHOLDER_RUN_pnpm_challenge_keygen"
source_visible: false
app: ./php-demo/index.php
fs:
  /flag.txt: ./php-demo/flag.txt
description: >
  A PHP application with a file inclusion vulnerability.
  Can you read the flag?
---

# PHP File Inclusion Demo

A simple PHP app that includes files based on a query parameter. Find a way to read `/flag.txt`.
