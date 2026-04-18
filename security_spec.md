# Security Specification for Viral Video Platform

## Data Invariants
1. Videos are public and read-only for standard users.
2. Only an admin (future setup) can create or update videos.
3. A video must have a valid string ID.

## The "Dirty Dozen" Payloads
1. Create video without authentication -> FAIL
2. Update video without admin role -> FAIL
3. Delete video without admin role -> FAIL
4. ID Poisoning (1MB ID string) -> FAIL
5. Shadow Update (adding `admin: true`) -> FAIL
6. Injecting a large string > 10MB in `thumbnail` -> FAIL
7. Missing required field during create -> FAIL
8. Invalid type (number instead of string for `duration`) -> FAIL
9. Reading private admin data -> FAIL
10. Blanket read bypassing PII (N/A, videos are public, but requires bounds) -> FAIL
11. Update video modifying ID -> FAIL
12. Creating video with invalid characters in ID -> FAIL

## The Test Runner
A test runner will verify all of these scenarios.
