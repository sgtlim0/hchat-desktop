#!/usr/bin/env node

/**
 * Security check script that runs npm audit and provides detailed reporting
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const AUDIT_LEVELS = {
  low: 1,
  moderate: 2,
  high: 3,
  critical: 4
};

function runAudit() {
  console.log('🔍 Running npm audit...\n');

  try {
    // Run npm audit with JSON output
    const result = execSync('npm audit --json --production', {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'pipe']
    });

    return JSON.parse(result);
  } catch (error) {
    // npm audit returns non-zero exit code when vulnerabilities are found
    // But we still get the JSON output in stdout
    if (error.stdout) {
      return JSON.parse(error.stdout);
    }
    throw error;
  }
}

function analyzeResults(auditData) {
  const metadata = auditData.metadata || {};
  const vulnerabilities = metadata.vulnerabilities || {};

  console.log('📊 Audit Summary:');
  console.log('─'.repeat(50));
  console.log(`Total dependencies: ${metadata.dependencies || 0}`);
  console.log(`Audited packages: ${metadata.totalDependencies || 0}`);
  console.log('\n📈 Vulnerabilities by severity:');
  console.log('─'.repeat(50));

  let hasHighOrCritical = false;

  Object.entries(vulnerabilities).forEach(([level, count]) => {
    if (count > 0) {
      const emoji = {
        info: 'ℹ️',
        low: '🟢',
        moderate: '🟡',
        high: '🔴',
        critical: '🚨'
      }[level] || '❓';

      console.log(`${emoji} ${level.padEnd(10)}: ${count}`);

      if (level === 'high' || level === 'critical') {
        hasHighOrCritical = true;
      }
    }
  });

  if (auditData.advisories) {
    console.log('\n⚠️  Vulnerability Details:');
    console.log('─'.repeat(50));

    Object.values(auditData.advisories).forEach(advisory => {
      const severity = advisory.severity;
      const severityEmoji = {
        low: '🟢',
        moderate: '🟡',
        high: '🔴',
        critical: '🚨'
      }[severity] || '❓';

      console.log(`\n${severityEmoji} ${advisory.title} (${severity})`);
      console.log(`   Module: ${advisory.module_name}`);
      console.log(`   Path: ${advisory.findings[0]?.paths[0] || 'N/A'}`);
      console.log(`   More info: ${advisory.url}`);
    });
  }

  // Save detailed report
  const reportPath = path.join(process.cwd(), 'npm-audit-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(auditData, null, 2));
  console.log(`\n📄 Detailed report saved to: ${reportPath}`);

  return hasHighOrCritical;
}

function main() {
  console.log('🛡️  Security Audit Check\n');

  try {
    const auditData = runAudit();
    const hasHighOrCritical = analyzeResults(auditData);

    if (hasHighOrCritical) {
      console.log('\n❌ High or critical vulnerabilities found!');
      console.log('Please run "npm audit fix" to attempt automatic fixes.');
      process.exit(1);
    } else {
      console.log('\n✅ No high or critical vulnerabilities found!');
      process.exit(0);
    }
  } catch (error) {
    console.error('\n❌ Error running security audit:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { runAudit, analyzeResults };