const db = require('./configs/db');

/**
 * Check and fix doctor_approvals table constraints
 * Allow multiple approval records per doctor (one per submission attempt)
 */

async function fixApprovalConstraints() {
  try {
    console.log('\n🔧 CHECKING doctor_approvals TABLE CONSTRAINTS\n');

    // Check for unique constraints on doctor_id
    const [constraints] = await db.query(`
      SELECT CONSTRAINT_NAME, COLUMN_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_NAME = 'doctor_approvals'
      AND COLUMN_NAME = 'doctor_id'
    `);

    console.log('Current constraints on doctor_id:');
    constraints.forEach(c => {
      console.log(`  - ${c.CONSTRAINT_NAME}: ${c.COLUMN_NAME}`);
    });

    // Check if there's a unique constraint
    const uniqueConstraint = constraints.find(c => c.CONSTRAINT_NAME !== 'PRIMARY');
    
    if (uniqueConstraint && uniqueConstraint.CONSTRAINT_NAME !== 'idx_doctor_status') {
      console.log(`\n⚠️  Found constraint: ${uniqueConstraint.CONSTRAINT_NAME}`);
      console.log('This needs to be removed to allow multiple approval records per doctor.\n');

      // Try to drop the constraint
      try {
        await db.execute(
          `ALTER TABLE doctor_approvals DROP CONSTRAINT ${uniqueConstraint.CONSTRAINT_NAME}`
        );
        console.log(`✅ Dropped constraint: ${uniqueConstraint.CONSTRAINT_NAME}`);
      } catch (e) {
        console.log(`Could not drop constraint (might be OK): ${e.message}`);
      }
    } else {
      console.log('\n✅ No problematic unique constraints found');
    }

    // Check indexes
    console.log('\n📊 Current indexes on doctor_approvals:');
    const [indexes] = await db.query(`
      SELECT INDEX_NAME, COLUMN_NAME, SEQ_IN_INDEX
      FROM INFORMATION_SCHEMA.STATISTICS
      WHERE TABLE_NAME = 'doctor_approvals'
      ORDER BY INDEX_NAME, SEQ_IN_INDEX
    `);

    indexes.forEach(idx => {
      console.log(`  - ${idx.INDEX_NAME}: ${idx.COLUMN_NAME} (position ${idx.SEQ_IN_INDEX})`);
    });

    console.log('\n✅ Constraint check complete\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixApprovalConstraints();
