# CoachingOS Database Schema & Entity Documentation

## Core Entities
1. **`organizations`**: Master tenant representing the coaching company/foundation.
2. **`branches`**: Physical campus centers belonging to an organization.
3. **`users`**: Platform actors (Owners, Teachers, Counsellors, Accountants, Students, Parents).
4. **`courses`**: Academic streams (JEE Advanced, NEET UG, CAT, CBSE 10).
5. **`subjects` & `topics`**: Hierarchical syllabus taxonomy.
6. **`batches`**: Operational cohorts with seat capacities, academic years, and timetable schedules.
7. **`students`**: Enrolled learners with roll numbers, batch joins, and guardian relationships.
8. **`leads`**: CRM prospects with E.164 phone numbers, sources, and follow-up timelines.
9. **`class_sessions` & `attendance_records`**: Classroom occurrences and student presence states.
10. **`fee_plans`, `invoices`, & `payments`**: Financial ledger tracking course costs, discounts, instalments, and UPI settlements.
11. **`questions`, `tests`, & `test_attempts`**: Item bank with LaTeX stems and student submissions.
12. **`interventions`**: Remediation cases linking attendance/test drops to faculty playbooks.
13. **`audit_logs`**: Immutable security log of privileged operations.

See production SQL script in project root: `coachingos_database_and_seed_data.sql`.
