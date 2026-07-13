-- Enable Row Level Security
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Student" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Class" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Modality" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Lesson" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Attendance" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassSchedule" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ClassStudent" ENABLE ROW LEVEL SECURITY;

-- Create Policies based on app.current_school_id setting

-- Direct check tables
CREATE POLICY user_tenant_isolation ON "User"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    "schoolId" = current_setting('app.current_school_id', true)
  );

CREATE POLICY student_tenant_isolation ON "Student"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    "schoolId" = current_setting('app.current_school_id', true)
  );

CREATE POLICY class_tenant_isolation ON "Class"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    "schoolId" = current_setting('app.current_school_id', true)
  );

CREATE POLICY modality_tenant_isolation ON "Modality"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    "schoolId" = current_setting('app.current_school_id', true)
  );

CREATE POLICY auditlog_tenant_isolation ON "AuditLog"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    "schoolId" = current_setting('app.current_school_id', true)
  );

-- Child check tables (using EXISTS subqueries)
CREATE POLICY lesson_tenant_isolation ON "Lesson"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    EXISTS (
      SELECT 1 FROM "Class" c 
      WHERE c.id = "Lesson"."classId" 
      AND c."schoolId" = current_setting('app.current_school_id', true)
    )
  );

CREATE POLICY attendance_tenant_isolation ON "Attendance"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    EXISTS (
      SELECT 1 FROM "Student" s 
      WHERE s.id = "Attendance"."studentId" 
      AND s."schoolId" = current_setting('app.current_school_id', true)
    )
  );

CREATE POLICY classschedule_tenant_isolation ON "ClassSchedule"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    EXISTS (
      SELECT 1 FROM "Class" c 
      WHERE c.id = "ClassSchedule"."classId" 
      AND c."schoolId" = current_setting('app.current_school_id', true)
    )
  );

CREATE POLICY classstudent_tenant_isolation ON "ClassStudent"
  FOR ALL
  USING (
    current_setting('app.current_school_id', true) = '' OR 
    current_setting('app.current_school_id', true) IS NULL OR 
    EXISTS (
      SELECT 1 FROM "Class" c 
      WHERE c.id = "ClassStudent"."classId" 
      AND c."schoolId" = current_setting('app.current_school_id', true)
    )
  );
