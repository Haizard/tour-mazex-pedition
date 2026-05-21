# Feature Testing Rules

Every feature must ship with its own test file before it can be pushed to `main`.

## Required Flow

1. Write the feature test first.
2. Run the test and confirm it fails for the expected missing behavior.
3. Implement the smallest production change that makes the test pass.
4. Run the feature-specific tests again.
5. Run the relevant build or integration check.
6. Push to `main` only after the feature tests and build are green.

## Feature Test File Checklist

- Backend behavior gets a matching file in `backend/tests/`.
- Frontend pure logic gets a matching `*.test.js` file beside the helper.
- Route registration changes get a route/source assertion test.
- UI routes get a route/source assertion test when browser automation is not required.
- Any feature that changes permissions must include an access-boundary test.

## Push Gate

Do not push implementation work to `main` until the latest terminal output shows:

- the new feature tests passing
- affected existing tests passing
- the production build passing

If global lint is blocked by existing unrelated debt, record that separately and run a narrowed lint or build check for the touched files.
