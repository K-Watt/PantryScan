Copilot Project Context

This file gives Copilot the context it should use while generating code for this repo. The goal is to keep the project consistent and focused.

Project Overview

The project is called Smart Pantry. It is a kitchen inventory and pantry scanner web app. The app tracks food items, lets users scan barcodes or upload receipts, updates quantities automatically, and gives recipe suggestions based on the current inventory.

The long term plan includes:

Barcode scanning with a camera

Receipt OCR to extract item names and quantities

A SQL backed inventory system

Automatic updates when items are used in recipes

A clean and simple web interface for adding and removing items

A meal planning feature that uses the inventory

A basic account system for families

Tech Stack

The project uses:

HTML, CSS, and JavaScript for the front end

React for the UI

A SQL database for inventory and user data

Python or Node for the back end API

OCR library support for receipt reading

A barcode scanning library through JavaScript

Coding Expectations

Copilot should follow these rules when generating code:

Write code that is modular and easy to maintain

Use clear function names

Keep every file focused on one purpose

Add comments for anything that is not obvious

Follow a clean folder structure

Keep logic separated from UI

Avoid unnecessary complexity

Make error handling friendly and predictable

Write functions that stay small

Validate all inputs and protect against unsafe queries

API Guidelines

Use clear request and response structures

Keep all database calls in a separate layer

Sanitize user input

Return JSON only

Use correct status codes

Provide simple logging for failure cases

Front End Guidelines

Use React functional components

Keep the layout mobile friendly

Keep state local unless it must be shared

Reuse logic with hooks when needed

Use fetch or axios for API calls

Give clear loading and error states

Receipt OCR Rules

Extract item names, prices, and quantities

Standardize names before saving to the database

Map items to known pantry entries

Flag unknown or unclear items for a manual check

Barcode Scanner Rules

Use a library that works well on mobile

Parse GS1 codes when possible

Match barcodes to known items with a lookup table

Suggest close matches if no perfect match exists

Inventory Logic

Track quantity, unit, purchase date, and expiration date

Deduct items when a recipe is prepared

Allow manual adjustments

Alert the user when an item is running low

Use item IDs to keep everything linked

Copilot Tone

When writing code, Copilot should:

Keep everything simple

Keep intent clear

Avoid clever tricks

Maintain consistent structure across the project

Copilot Workspace Agent Rules

These instructions guide Copilot Workspace so the agent understands how to plan tasks, break down work, and generate code in a clean way.

Agent Behavior

The workspace agent should:

Break tasks into small logical steps

Explain the plan before generating code

Use the current folder structure and respect existing patterns

Avoid creating files that do not match the project layout

Reuse existing components and functions

Keep pull request sized changes

Avoid rewriting large parts of the project unless asked

Keep code readable and predictable

Ask for missing context when needed

Keep security and validation in mind at all times

Workspace Goals

The agent should focus on:

Completing features for the pantry scanner

Improving code clarity

Fixing bugs

Keeping naming and structure consistent

Keeping the SQL and API layers clean and safe

Supporting the long term goal of a stable inventory system

Test Writing Rules

All new features should include a basic test plan and code tests when possible.

General Test Rules

Write simple and direct test cases

Use clear names for tests

Cover normal use, edge cases, and failure cases

Do not create huge test files

Keep each test focused on one thing

Use sample data that is easy to read

Mock external calls when needed

Keep the test folder organized

Front End Tests

Test component rendering

Test user interaction

Test state changes

Test API calls with mocks

Make sure loading and error states behave correctly

Back End Tests

Test API endpoints

Test validation

Test database access through a mock layer

Confirm correct status codes and responses

Test failure cases and empty states

OCR and Barcode Tests

Test sample receipt text extraction

Test item mapping

Test incorrect or incomplete data

Test common barcode formats

Test lookup logic and fallback suggestions