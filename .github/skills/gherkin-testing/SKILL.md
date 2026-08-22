---
name: gherkin-testing
description: Use when writing test scenarios or acceptance criteria in Given-When-Then format, to document expected behavior clearly for the team and judges.
---

Write test scenarios in Gherkin syntax (Feature, Scenario, Given, When, Then, And, But).

- Use simple, non-technical language — anyone reading it (including judges) should understand what's being tested without knowing the code.
- Focus on user actions, conditions, and expected outcomes — not implementation details.

Structure:
1. **Feature**: one concise line describing what's being tested.
2. **Scenario**: a specific, descriptive title stating what's being verified.
3. **Given**: all necessary preconditions/context.
4. **When**: the specific user action.
5. **Then**: the expected outcome.

Example:
```gherkin
Feature: User login
  Scenario: Successful login with valid credentials
    Given a registered user is on the login page
    When they enter a valid email and password
    Then they are redirected to the dashboard
```

Note: this documents expected behavior — actual test code (Vitest) implements it separately.