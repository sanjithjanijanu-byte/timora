Build a complete web-based "Automation Lab Practical Exam Scheduling & Allocation System" for a college.

The main purpose of the system is to automatically schedule practical/lab examinations for multiple classes and batches while assigning:

1. Class & Section
2. Batch
3. Subject / Lab
4. Exam Date
5. Time Slot
6. Laboratory / Venue
7. In-Charge Faculty
8. Co-In-Charge Faculty

The system must automatically allocate these without clashes and while respecting laboratory capacity and faculty workload.

==================================================
1. ADMIN DASHBOARD
==================================================

Create an Admin Dashboard with:

- Total Classes
- Total Batches
- Total Subjects/Labs
- Total Faculty
- Total Laboratories
- Scheduled Exams
- Pending Exams
- Faculty Workload
- Available Lab Capacity

Show a calendar/timetable view of the practical examinations.

Provide buttons:

- Add Class
- Add Batch
- Add Subject
- Add Faculty
- Add Laboratory
- Create Exam Schedule
- Auto Allocate
- View Schedule
- Faculty Workload
- Export Schedule

==================================================
2. CLASS & SECTION MANAGEMENT
==================================================

Admin should be able to add:

- Class
- Section
- Department
- Year/Semester
- Batch Size
- Number of Batches

Example:

Class: BCA Gen AI
Section: A
Batch Size: 35
Number of Batches: 5

The system should support multiple classes and sections.

Example:

BCA Gen AI - A
BCA Gen AI - B
BCA - C
B.Sc CS - A
etc.

==================================================
3. BATCH MANAGEMENT
==================================================

Automatically divide students into batches according to the maximum batch size.

Default maximum batch size:

30–35 students.

Example:

Class: BCA A
Students: 170

Automatically generate:

Batch 1
Batch 2
Batch 3
Batch 4
Batch 5

The administrator should also be able to manually modify batches.

==================================================
4. SUBJECT / LAB MANAGEMENT
==================================================

Admin can add practical subjects/labs.

Each subject should contain:

- Subject Name
- Subject Code
- Number of Lab Sessions Required
- Duration
- Required Laboratory Type
- Faculty Requirements

Example:

Subject: Computer Networks Lab
Code: CN Lab
Sessions: 1
Duration: 3 Hours

If a subject requires multiple practical sessions, the system should automatically schedule all required sessions.

==================================================
5. LABORATORY / VENUE MANAGEMENT
==================================================

Admin can add laboratories.

Each laboratory should contain:

- Lab Name
- Lab Number
- Building
- Floor
- Capacity
- Available Equipment
- Lab Type
- Availability

Example:

Lab 1
Capacity: 35

Lab 2
Capacity: 35

Lab 3
Capacity: 30

The system must NEVER assign a batch to a laboratory whose capacity is lower than the batch size.

Example:

Batch = 35 students
Lab Capacity = 30

Do NOT allocate that lab.

==================================================
6. FACULTY MANAGEMENT
==================================================

Admin can add faculty members.

Each faculty member should contain:

- Faculty Name
- Faculty ID
- Department
- Subject Expertise
- Maximum Exam Load
- Current Assigned Load
- Availability

Faculty roles:

- In-Charge
- Co-In-Charge

The system must automatically assign faculty to each practical examination.

Example:

CN Lab
Batch 1
In-Charge: Faculty A
Co-In-Charge: Faculty B

CN Lab
Batch 2
In-Charge: Faculty C
Co-In-Charge: Faculty D

==================================================
7. EXAM TIME SLOTS
==================================================

Default practical examination duration:

3 Hours.

Create these default slots:

Slot 1:
8:30 AM – 11:30 AM

Slot 2:
11:30 AM – 2:30 PM

Slot 3:
2:30 PM – 5:30 PM

Admin should be able to add/edit time slots.

==================================================
8. AUTOMATIC SCHEDULING ENGINE
==================================================

This is the most important feature.

Create an automatic scheduling algorithm.

The administrator enters:

- Classes
- Sections
- Batch sizes
- Subjects
- Number of sessions
- Available dates
- Available laboratories
- Faculty
- Faculty workload limits
- Time slots

Then click:

"GENERATE AUTOMATIC SCHEDULE"

The system automatically creates the complete practical exam timetable.

==================================================
9. ALLOCATION RULES
==================================================

The automatic scheduler MUST follow these rules:

RULE 1:
A batch cannot have two examinations at the same time.

RULE 2:
A laboratory cannot be assigned to two batches during the same time slot.

RULE 3:
A faculty member cannot be assigned to two examinations during the same time slot.

RULE 4:
Lab capacity must be greater than or equal to batch size.

RULE 5:
Assign only available laboratories.

RULE 6:
Assign only available faculty.

RULE 7:
Do not exceed the maximum faculty workload.

RULE 8:
Try to distribute faculty workload evenly.

RULE 9:
Each examination must have:

- One In-Charge
- One Co-In-Charge

RULE 10:
In-Charge and Co-In-Charge should not be the same person.

RULE 11:
Avoid assigning the same faculty member repeatedly if other eligible faculty are available.

RULE 12:
Avoid unnecessary gaps between sessions when possible.

RULE 13:
If multiple classes require the same lab, automatically move one batch to another available lab or time slot.

RULE 14:
If no valid allocation is possible, show the conflict instead of creating an invalid schedule.

==================================================
10. AUTOMATIC VENUE ALLOCATION
==================================================

The system must automatically select the best available laboratory.

Example:

Batch 1:
35 students

Available labs:

Lab 1 = 40 capacity
Lab 2 = 30 capacity
Lab 3 = 35 capacity

Assign:

Lab 3 or Lab 1

Do NOT assign Lab 2.

Prefer the smallest suitable laboratory to optimize capacity.

==================================================
11. AUTOMATIC FACULTY ALLOCATION
==================================================

For every scheduled practical examination automatically assign:

In-Charge
Co-In-Charge

Example:

Class: BCA A
Batch: B1
Subject: Computer Networks Lab
Date: 15-09-2026
Time: 8:30 AM – 11:30 AM
Venue: Lab 2
In-Charge: Dr. Faculty 1
Co-In-Charge: Dr. Faculty 2

The faculty workload should be tracked automatically.

Example:

Faculty 1
Maximum Load: 4
Assigned: 3
Remaining: 1

Once maximum load is reached, the scheduler should avoid assigning additional examinations to that faculty member.

==================================================
12. SCHEDULING TABLE
==================================================

Create a clean timetable:

| Date | Time | Class | Section | Batch | Subject | Venue | In-Charge | Co-In-Charge |
|------|------|-------|---------|-------|---------|-------|-----------|--------------|

Example:

15 Sep | 8:30-11:30 | BCA | A | B1 | CN Lab | Lab 1 | Faculty A | Faculty B
15 Sep | 8:30-11:30 | BCA | A | B2 | CN Lab | Lab 2 | Faculty C | Faculty D
15 Sep | 11:30-2:30 | BCA | A | B3 | CN Lab | Lab 1 | Faculty E | Faculty F

==================================================
13. CONFLICT DETECTION
==================================================

Create a "Conflict Detection" section.

Detect:

- Faculty clash
- Lab clash
- Batch clash
- Capacity violation
- Faculty workload violation
- Missing faculty
- Missing venue
- Missing time slot

Display conflicts clearly.

Example:

⚠ Faculty Clash
Faculty A is assigned to BCA-A-B1 and BCA-B-B2 at 8:30 AM.

⚠ Lab Capacity Issue
Batch B3 contains 35 students but Lab 4 capacity is only 30.

Provide:

"Auto Resolve Conflicts"

button.

==================================================
14. FACULTY WORKLOAD
==================================================

Create a faculty workload page.

Display:

| Faculty | Maximum Load | Assigned | Remaining |
|---------|--------------|----------|-----------|
| Faculty A | 5 | 4 | 1 |
| Faculty B | 5 | 3 | 2 |
| Faculty C | 4 | 4 | 0 |

Use workload balancing during automatic allocation.

==================================================
15. LAB UTILIZATION
==================================================

Create a laboratory utilization page.

Display:

Lab 1
Capacity: 40
Total Exams: 8
Utilization: 80%

Lab 2
Capacity: 35
Total Exams: 6
Utilization: 60%

Show which time slots are occupied and which are available.

==================================================
16. MANUAL EDITING
==================================================

After automatic scheduling, Admin must be able to manually change:

- Date
- Time
- Venue
- Faculty
- Batch

When changing anything, immediately check for conflicts.

Do not allow saving an invalid allocation.

==================================================
17. SCHEDULE GENERATION FLOW
==================================================

Use this workflow:

STEP 1:
Admin enters Classes and Sections.

STEP 2:
Admin enters student/batch information.

STEP 3:
Admin enters practical subjects.

STEP 4:
Admin enters available laboratories and capacities.

STEP 5:
Admin enters faculty and workload limits.

STEP 6:
Admin selects examination dates.

STEP 7:
System loads available 3-hour slots.

STEP 8:
System automatically divides students into batches.

STEP 9:
System allocates subjects to batches.

STEP 10:
System allocates available laboratories.

STEP 11:
System allocates In-Charge faculty.

STEP 12:
System allocates Co-In-Charge faculty.

STEP 13:
System checks all conflicts.

STEP 14:
System balances faculty workload.

STEP 15:
System generates final timetable.

==================================================
18. EXPORT
==================================================

Provide export options:

- Excel
- PDF
- CSV

Generate:

1. Complete Exam Schedule
2. Class-wise Schedule
3. Faculty-wise Schedule
4. Lab-wise Schedule
5. Batch-wise Schedule

==================================================
19. CLASS-WISE VIEW
==================================================

Admin can select:

Class → Section

and see:

Date
Time
Batch
Subject
Venue
In-Charge
Co-In-Charge

==================================================
20. FACULTY-WISE VIEW
==================================================

Selecting a faculty member should show:

Faculty Name
Date
Time
Class
Batch
Subject
Venue
Role

==================================================
21. LAB-WISE VIEW
==================================================

Selecting a laboratory should show:

Lab
Date
Time
Class
Batch
Subject
Faculty

==================================================
22. USER INTERFACE
==================================================

Create a professional college administration interface.

Use:

- React
- Vite
- Tailwind CSS
- Flask/FastAPI backend
- MySQL/PostgreSQL database

Use a clean dashboard with:

Sidebar:
Dashboard
Classes
Batches
Subjects
Faculty
Laboratories
Time Slots
Auto Scheduler
Exam Schedule
Faculty Workload
Lab Utilization
Conflicts
Reports
Settings

Use tables, cards, filters, search and calendar/timetable views.

==================================================
23. IMPORTANT AUTOMATION REQUIREMENT
==================================================

The system should NOT simply generate random assignments.

Use a constraint-based allocation approach.

Priority order:

1. No clashes
2. Lab capacity
3. Faculty availability
4. Faculty maximum workload
5. Even faculty workload distribution
6. Efficient laboratory utilization
7. Balanced scheduling
8. Minimize unnecessary gaps

If a complete schedule cannot be generated, clearly explain why and show the unscheduled batches.

Example:

"Batch B5 could not be scheduled because:
- No laboratory with capacity ≥ 35 is available in the selected dates.
- Faculty availability is exhausted."

Then suggest alternative dates, labs or faculty.

==================================================
24. FINAL OUTPUT
==================================================

The final generated schedule should look like:

PRACTICAL EXAMINATION SCHEDULE

| Date | Time | Class | Section | Batch | Subject | Venue | In-Charge | Co-In-Charge |
|------|------|-------|---------|-------|---------|-------|-----------|--------------|
| 15/09 | 8:30-11:30 | BCA | A | B1 | CN Lab | Lab 1 | Staff 1 | Staff 2 |
| 15/09 | 8:30-11:30 | BCA | A | B2 | CN Lab | Lab 2 | Staff 3 | Staff 4 |
| 15/09 | 11:30-2:30 | BCA | A | B3 | CN Lab | Lab 1 | Staff 5 | Staff 6 |

Make the system fully responsive and suitable for actual college practical examination scheduling.