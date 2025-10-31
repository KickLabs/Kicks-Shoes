# Universal Feature Analysis Prompt - Rationale Analysis

## 1. Main Purpose

This prompt is designed to generate a **comprehensive technical & testing analysis** for any feature. It combines:

- **Codebase analysis** - Analyzing code and dependencies
- **UI flow mapping** - Mapping user flows
- **Reverse engineering** - Understanding logic from code
- **QA/Test Architecture** - Designing a testing strategy

## 2. Why is This Prompt Needed?

### Current Problems

- **Lack of context**: When testing a feature, it's necessary to clearly understand the business logic, UI flows, and dependencies.
- **Test planning**: A clear structure is needed to plan test cases.
- **Mocking strategy**: Need to know which dependencies to mock.
- **Priority setting**: Need to know which parts are most important to test.

### Solution

- **Comprehensive analysis**: A comprehensive analysis of every aspect of the feature.
- **Structured approach**: A clear structure for test planning.
- **Dependency mapping**: Clearly identify dependencies that need mocking.
- **Risk-based prioritization**: Focus on high-risk areas.

## 3. How is the OUTPUT Structure Designed?

### Section 1: Feature Overview

- **Business Purpose**: Understand why this feature exists.
- **Key UI Flows**: Understand the user journey.
- **Main Business Rules**: Understand constraints and logic.
- **Testing Importance**: Understand why thorough testing is needed.

**Rationale**: Must clearly understand the business context before testing.

### Section 2: UI/UX Flow Mapping

- **Step-by-step mapping**: Understand user interactions in detail.
- **System Behavior**: Understand the system's response.
- **State Changes**: Understand the data flow.

**Rationale**: UI flows are the foundation for test cases.

### Section 3: Related Files & Components

- **Complete file mapping**: Find all related files.
- **Layer classification**: Categorize by architecture layers.
- **Responsibility mapping**: Understand the responsibility of each file.

**Rationale**: Need to know all related components to test.

### Section 4: Core Functions Analysis

- **Function-level analysis**: Detailed analysis of each function.
- **Input/Output mapping**: Understand data flow.
- **Edge cases identification**: Find boundary conditions.
- **Dependencies mapping**: Understand external dependencies.

**Rationale**: Functions are the core of the feature and need to be tested thoroughly.

### Section 5: Test Case Matrix

- **Comprehensive coverage**: Happy/Edge/Error scenarios.
- **Structured format**: Easy to read and implement.
- **Pre-condition mapping**: Understand test setup requirements.

**Rationale**: Test cases need a clear structure.

### Section 6: Test Priority

- **Risk-based prioritization**: Focus on high-risk areas.
- **Business impact**: Understand the impact on the business.
- **Complexity consideration**: Understand the technical complexity.

**Rationale**: Need to know what to prioritize testing first.

### Section 7: Mocking Strategy

- **Dependency mapping**: Know what to mock.
- **Mocking strategy**: Know how to mock.
- **Sample data**: Have data to test with.

**Rationale**: Mocking is key for test isolation.

### Section 8: Next Steps

- **Actionable prompts**: Guide the next steps.
- **Specific tasks**: Concrete tasks for implementation.

**Rationale**: Need a clear roadmap for implementation.

## 4. Why is This Structure Needed?

### Completeness

- **Doesn't miss any aspect of the feature**
- **Covers both technical and business perspectives**

**Rationale**: Test planning requires comprehensive analysis.

### Testability

- **Easy to convert into test cases**
- **Provides sufficient information to write tests**

**Rationale**: Analysis must be actionable for testing.

### Maintainability

- **Clear structure, easy to update**
- **Can be reused for other features**

**Rationale**: The template can scale for many features.

### Collaboration

- **Easy to share with team members**
- **Easy to review and provide feedback**

**Rationale**: The team needs a shared understanding.

## 5. Detailed Section Breakdown

### Section 1: Feature Overview

#### Business Purpose

- **Purpose**: Understand why this feature exists.
- **Why it's needed**: Test cases must align with business goals.
- **Example**: "This feature helps users manage their profile to increase engagement."

#### Key UI Flows

- **Purpose**: Understand the user journey.
- **Why it's needed**: Test cases must cover user flows.
- **Example**: "View Profile → Edit Profile → Save Changes → View Updated Profile"

#### Main Business Rules

- **Purpose**: Understand constraints and logic.
- **Why it's needed**: Test cases must validate business rules.
- **Example**: "User must be logged in, email must be unique, phone must be in the correct format."

#### Testing Importance

- **Purpose**: Understand why thorough testing is needed.
- **Why it's needed**: To prioritize test effort.
- **Example**: "High-impact on user experience, complex state logic."

### Section 2: UI/UX Flow Mapping

#### Step-by-step mapping

- **Purpose**: Understand user interactions in detail.
- **Why it's needed**: Test cases must cover every step.
- **Format**: Table with Step, UI Screen, User Action, System Behavior.

#### System Behavior

- **Purpose**: Understand the system's response.
- **Why it's needed**: Test cases must validate system behavior.
- **Example**: "System displays loading, validates input, calls API, updates UI."

#### State Changes

- **Purpose**: Understand the data flow.
- **Why it's needed**: Test cases must validate state changes.
- **Example**: "isLoading: false → true → false, userData: null → userData object"

### Section 3: Related Files & Components

#### Complete file mapping

- **Purpose**: Find all related files.
- **Why it's needed**: Test cases must cover all components.
- **Format**: Table with File/Path, Layer, Responsibility, Key Methods.

#### Layer classification

- **Purpose**: Categorize by architecture layers.
- **Why it's needed**: Different test strategies for each layer.
- **Layers**: UI, Logic, Service, State, API.

#### Responsibility mapping

- **Purpose**: Understand the responsibility of each file.
- **Why it's needed**: Test cases must validate responsibilities.
- **Example**: "Profile.vue: UI rendering, useUser.js: state management, userService.js: API calls"

### Section 4: Core Functions Analysis

#### Function-level analysis

- **Purpose**: Detailed analysis of each function.
- **Why it's needed**: Test cases must cover all functions.
- **Format**: Function name, Purpose, Inputs, Outputs, State Changes, Edge Cases, Dependencies.

#### Input/Output mapping

- **Purpose**: Understand data flow.
- **Why it's needed**: Test cases must validate input/output.
- **Example**: "Input: userData object, Output: updated user object"

#### Edge cases identification

- **Purpose**: Find boundary conditions.
- **Why it's needed**: Test cases must cover edge cases.
- **Example**: "Input null, empty string, invalid email, network error"

#### Dependencies mapping

- **Purpose**: Understand external dependencies.
- **Why it's needed**: Test cases must mock dependencies.
- **Example**: "API calls, database operations, external services"

### Section 5: Test Case Matrix

#### Comprehensive coverage

- **Purpose**: Happy/Edge/Error scenarios.
- **Why it's needed**: Test coverage must be complete.
- **Categories**: Happy Path, Edge Case, Error Handling, Performance, Security.

#### Structured format

- **Purpose**: Easy to read and implement.
- **Why it's needed**: Test cases must have a clear structure.
- **Format**: Table with Category, Scenario, Pre-condition, Input, Expected Output.

#### Pre-condition mapping

- **Purpose**: Understand test setup requirements.
- **Why it's needed**: Test cases must have the correct setup.
- **Example**: "User is logged in, has valid userData, API service is available."

### Section 6: Test Priority

#### Risk-based prioritization

- **Purpose**: Focus on high-risk areas.
- **Why it's needed**: Test effort is limited.
- **Criteria**: Business impact, technical complexity, user impact.

#### Business impact

- **Purpose**: Understand the impact on the business.
- **Why it's needed**: Test cases must align with business priorities.
- **Example**: "High: Revenue impact, Medium: User experience, Low: Nice-to-have"

#### Complexity consideration

- **Purpose**: Understand the technical complexity.
- **Why it's needed**: Test effort must match complexity.
- **Example**: "High: Complex algorithms, Medium: Standard CRUD, Low: Simple validation"

### Section 7: Mocking Strategy

#### Dependency mapping

- **Purpose**: Know what to mock.
- **Why it's needed**: For test isolation.
- **Dependencies**: APIs, databases, external services, file system.

#### Mocking strategy

- **Purpose**: Know how to mock.
- **Why it's needed**: Mocks must be realistic and maintainable.
- **Strategies**: Jest mocks, MSW (Mock Service Worker), manual mocks.

#### Sample data

- **Purpose**: Have data to test with.
- **Why it's needed**: Test data must be realistic.
- **Data**: Vietnamese names, addresses, phone numbers, emails.

### Section 8: Next Steps

#### Actionable prompts

- **Purpose**: Guide the next steps.
- **Why it's needed**: Analysis must be actionable.
- **Prompts**: Specific prompts to generate test code, mocks, etc.

#### Specific tasks

- **Purpose**: Concrete tasks for implementation.
- **Why it's needed**: The team needs a clear roadmap.
- **Tasks**: Write unit tests, integration tests, E2E tests, setup mocks.

## 6. Rationale Summary

### Core Principles

1. **Comprehensive Analysis**: Cover all aspects of the feature.
2. **Test-Focused**: Structured with the goal of writing tests.
3. **Actionable**: Provides concrete next steps.
4. **Reusable**: Can be applied to any feature.
5. **Structured**: Clear format, easy to read and implement.

### Key Benefits

- **Complete Understanding**: Clearly understand the feature from every angle.
- **Test Planning**: A clear structure to plan tests.
- **Dependency Management**: Know what to mock and how.
- **Priority Setting**: Know what to prioritize testing first.
- **Team Collaboration**: Easy to share and collaborate.
- **Maintainability**: Easy to maintain and update.

### Technical Excellence

- **Codebase Analysis**: Analyze code and dependencies.
- **UI Flow Mapping**: Map user interactions.
- **Function Analysis**: Detailed analysis of functions.
- **Test Case Matrix**: Comprehensive test scenarios.
- **Mocking Strategy**: Professional mocking approach.
- **Next Steps**: Actionable implementation plan.

This prompt helps create a complete analysis document, from which it is easy to convert into test cases and an implementation plan.
