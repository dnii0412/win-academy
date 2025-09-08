# Course Access Fix Verification Checklist

## ✅ **Step 1: Test Paid User Course Access**

### What to Test:
- Users who have successfully paid for courses should be able to access course content
- The "Access required" page should not show for paid users

### How to Test:
1. **Login as a user who has paid for a course**
2. **Navigate to `/learn/[courseId]` for a paid course**
3. **Expected Result**: Should see course content, not "Access required" page

### Manual Verification:
```bash
# Check if user has course access
curl -X GET "http://localhost:3000/api/courses/[courseId]/access" \
  -H "Cookie: [your-session-cookie]"
```

---

## ✅ **Step 2: Test Webhook Course Unlock**

### What to Test:
- QPay webhook should create course access when payment is completed
- Course access should be created with correct userId format

### How to Test:
1. **Make a test payment through QPay**
2. **Check database for CourseAccess record**
3. **Verify userId format is consistent**

### Database Check:
```javascript
// In MongoDB shell or admin panel
db.courseaccesses.find({
  hasAccess: true,
  accessType: "purchase"
}).pretty()
```

---

## ✅ **Step 3: Test Access Control with Dummy User**

### What to Test:
- Course access verification works with both userId formats
- New access verification logic handles edge cases

### How to Test:
1. **Create a test user**
2. **Grant course access manually**
3. **Test access verification with both userId formats**

### Test Script:
```bash
# Run the verification script (requires MONGODB_URI)
npx tsx scripts/verify-course-access-fix.ts
```

---

## ✅ **Step 4: Validate with Client**

### What to Test:
- Real client data works with the new access verification
- No existing course access is broken

### How to Test:
1. **Check all existing course access records**
2. **Verify they work with new verification logic**
3. **Test with real client accounts**

---

## ✅ **Step 5: Deploy to Production**

### What to Deploy:
- Updated learn page with dual userId check
- Updated course access API with dual userId check
- Updated payment flow with consistent userId format

### Files Changed:
- `app/learn/[courseId]/page.tsx` - Fixed course access verification
- `app/api/courses/[courseId]/access/route.ts` - Fixed access check API
- `app/api/pay/qpay/create/route.ts` - Standardized userId format
- `lib/user-utils.ts` - New utility functions

---

## 🔧 **Troubleshooting**

### If Course Access Still Doesn't Work:

1. **Check Database Records**:
   ```javascript
   // Find course access for specific user
   db.courseaccesses.find({
     $or: [
       { userId: "user@example.com" },
       { userId: ObjectId("user_object_id") }
     ],
     courseId: ObjectId("course_id"),
     hasAccess: true
   })
   ```

2. **Check Order Status**:
   ```javascript
   // Find paid orders
   db.orders.find({
     userEmail: "user@example.com",
     status: { $in: ["PAID", "completed"] }
   })
   ```

3. **Manual Access Grant**:
   ```javascript
   // Grant access manually if needed
   db.courseaccesses.insertOne({
     userId: "user@example.com",
     courseId: ObjectId("course_id"),
     hasAccess: true,
     accessType: "purchase",
     status: "active",
     grantedAt: new Date()
   })
   ```

---

## 📊 **Success Criteria**

- ✅ Paid users can access course content
- ✅ No "Access required" page for paid users
- ✅ Course access verification works with both userId formats
- ✅ Webhook creates course access correctly
- ✅ No existing course access is broken
- ✅ New payments create course access with consistent userId format

---

## 🚀 **Next Steps After Verification**

1. **Monitor Production Logs** for any access verification errors
2. **Test with Real Payments** to ensure webhook works
3. **Update Client Documentation** about course access
4. **Set up Monitoring** for course access issues
