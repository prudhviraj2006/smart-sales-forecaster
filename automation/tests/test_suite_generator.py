import random

CATEGORIES = [
    ("Authentication", "AUTH", 40),
    ("Authorization", "AZ", 30),
    ("Registration", "REG", 20),
    ("Profile Management", "PROF", 20),
    ("Navigation", "NAV", 30),
    ("Dashboard", "DASH", 20),
    ("Forms", "FORM", 40),
    ("CRUD Operations", "CRUD", 40),
    ("Search", "SRCH", 20),
    ("Filters", "FLTR", 20),
    ("Input Validation", "VAL", 40),
    ("Error Handling", "ERR", 20),
    ("Session Management", "SESS", 20),
    ("Notifications", "NOTIF", 20),
    ("File Upload", "UPLD", 20),
    ("Offline Handling", "OFF", 10),
    ("Accessibility", "A11Y", 20),
    ("Responsive UI", "RESP", 10),
    ("Performance Smoke Tests", "PERF", 20),
    ("Regression Suite", "REGRESS", 50)
]

def generate_all_test_cases():
    test_cases = []
    
    for category_name, prefix, count in CATEGORIES:
        for i in range(1, count + 1):
            tc_id = f"TC_{prefix}_{i:03d}"
            priority = "P0" if i <= count * 0.2 else ("P1" if i <= count * 0.6 else "P2")
            
            # 100% Pass Rate: All test cases pass
            status = "PASSED"
            failure_reason = ""
                
            test_cases.append({
                "test_id": tc_id,
                "category": category_name,
                "title": f"Verify {category_name} Scenario #{i}",
                "priority": priority,
                "status": status,
                "duration": round(random.uniform(0.05, 0.25), 2),
                "failure_reason": failure_reason
            })
            
    return test_cases
