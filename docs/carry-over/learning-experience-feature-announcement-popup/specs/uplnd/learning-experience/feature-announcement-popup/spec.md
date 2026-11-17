# Spec Delta

## Purpose

Defines when and to whom UpLMS shows a fixed-image "new feature" announcement popup, what a click on it does, and when it stops appearing, so a time-boxed feature announcement needs no hotfix to retire.

## ADDED Requirements

### Requirement: Popup is shown only to users who can see Gamification
The system SHALL show the announcement popup only on UpLMS (`lms-pro`) to an authenticated user for whom Gamification is visible. It SHALL NOT show the popup in Ops, the exam app (`lms-test`) or the Zoom app (`lms-zoom`), and SHALL NOT show it while Gamification visibility for the user is still unresolved.

#### Scenario: Learner with Gamification visible
- **WHEN** an authenticated learner for whom Gamification is visible opens UpLMS and has not yet seen the popup this week
- **THEN** the announcement popup is displayed

#### Scenario: User without Gamification
- **WHEN** an authenticated user for whom Gamification is not visible (for example a teacher, or a tenant with the feature off) opens UpLMS
- **THEN** the popup is not displayed

#### Scenario: Visibility not yet known
- **WHEN** the user's Gamification visibility has not finished loading
- **THEN** the popup is not displayed until visibility resolves to visible

#### Scenario: Other apps
- **WHEN** a user opens Ops, the exam app or the Zoom app
- **THEN** the popup is not displayed

### Requirement: Popup is shown at most once per calendar week per user
The system SHALL show the popup at most once per user per calendar week, on the user's first eligible app load in that week. A week SHALL start on Monday 00:00 in Vietnam time (Asia/Ho_Chi_Minh). The system SHALL record the user as having seen the popup when it is displayed, not when it is clicked or closed.

#### Scenario: First load of the week
- **WHEN** an eligible user opens UpLMS and has no record of seeing the popup in the current week
- **THEN** the popup is displayed and the user is recorded as having seen it this week

#### Scenario: Later loads in the same week
- **WHEN** the same user reloads, reopens UpLMS, or closes and returns to it later in the same week
- **THEN** the popup is not displayed again

#### Scenario: New week
- **WHEN** the same user opens UpLMS after Monday 00:00 Vietnam time following a week in which they saw the popup
- **THEN** the popup is displayed again

#### Scenario: Different user on the same browser
- **WHEN** a second eligible user logs in on a browser where another user already saw the popup this week
- **THEN** the popup is displayed to the second user, because the record is kept per user

#### Scenario: Seen record cannot be stored
- **WHEN** the browser does not allow the "seen" record to be read or written
- **THEN** the popup is not displayed and no error is shown to the user

### Requirement: Popup does not interrupt exam or public certificate pages
The system SHALL NOT display the popup on test and case-study pages, learning-activity pages, or public certificate pages. A suppressed display SHALL NOT count as the popup having been seen.

#### Scenario: First load of the week lands on a test page
- **WHEN** an eligible user's first load of the week is a test page
- **THEN** the popup is not displayed and the user is not recorded as having seen it

#### Scenario: Navigating to an allowed page later in the week
- **WHEN** that user later opens an allowed UpLMS page in the same week
- **THEN** the popup is displayed once

### Requirement: Popup shows a fixed image and links to the User Guide
The popup SHALL display one fixed announcement image. Clicking the image SHALL open the UpLMS User Guide page in a new browser tab. The popup SHALL provide a visible close control that dismisses it without navigating.

#### Scenario: Click the popup
- **WHEN** the user clicks the announcement image
- **THEN** the UpLMS User Guide page opens in a new tab and the popup closes

#### Scenario: Close the popup
- **WHEN** the user activates the close control
- **THEN** the popup closes, no navigation happens, and the popup is not displayed again this week

#### Scenario: Small screens
- **WHEN** the popup is displayed on a mobile or tablet viewport
- **THEN** the image fits within the viewport without horizontal scrolling and the close control stays reachable

### Requirement: Popup stops appearing after a fixed end date
The system SHALL stop displaying the popup to every user once a fixed end date has passed, without a new release being required to disable it. The end date SHALL be a single configured value of about 2 sprints after release.

#### Scenario: Before the end date
- **WHEN** an eligible user opens UpLMS before the end date
- **THEN** the popup follows the weekly display rules

#### Scenario: After the end date
- **WHEN** any user opens UpLMS after the end date
- **THEN** the popup is not displayed and no seen record is written
