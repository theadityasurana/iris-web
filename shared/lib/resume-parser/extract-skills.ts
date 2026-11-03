import type { SectionMap } from './types';
import { getSectionLines, getBulletPoints } from './extract-text';

const COMMON_SKILLS = [
  'JavaScript', 'TypeScript', 'Python', 'Java', 'C++', 'C#', 'C', 'Go', 'Rust', 'Ruby', 'PHP', 'Swift', 'Kotlin', 'Scala', 'R', 'MATLAB',
  'React', 'React Native', 'Angular', 'Vue', 'Next.js', 'Node.js', 'Express', 'Django', 'Flask', 'Spring', 'Spring Boot', '.NET', 'Rails',
  'HTML', 'CSS', 'SASS', 'LESS', 'Tailwind', 'Bootstrap', 'Material UI',
  'AWS', 'Azure', 'GCP', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD', 'GitHub Actions',
  'SQL', 'MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'DynamoDB', 'Firebase', 'Supabase', 'Elasticsearch',
  'Git', 'Linux', 'Bash', 'REST', 'GraphQL', 'gRPC', 'WebSocket',
  'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'TensorFlow', 'PyTorch', 'Scikit-learn',
  'Figma', 'Sketch', 'Adobe XD', 'Photoshop', 'Illustrator',
  'Agile', 'Scrum', 'Jira', 'Confluence', 'Notion',
  'Data Analysis', 'Data Engineering', 'ETL', 'Spark', 'Hadoop', 'Kafka', 'Airflow',
  'Microservices', 'System Design', 'API Design', 'OAuth', 'JWT',
  'iOS', 'Android', 'Flutter', 'Expo', 'SwiftUI',
  'Tableau', 'Power BI', 'Excel', 'Pandas', 'NumPy',
  'Blockchain', 'Solidity', 'Web3',
  'Unity', 'Unreal Engine',
  'SAP', 'Salesforce', 'ServiceNow',
  'Communication', 'Leadership', 'Problem Solving', 'Teamwork', 'Project Management',
];

export function extractSkills(sections: SectionMap, allText: string): string[] {
  const lines = getSectionLines(sections, 'skills');
  const skills: Set<string> = new Set();

  if (lines.length > 0) {
    // Extract from skills section
    const bulletPoints = getBulletPoints(lines);
    for (const bp of bulletPoints) {
      // Skills are often comma or pipe separated
      const parts = bp.split(/[,|•·;]/).map(s => s.trim()).filter(s => s.length > 0 && s.length < 50);
      for (const part of parts) {
        // Remove labels like "Languages:", "Frameworks:", etc.
        const cleaned = part.replace(/^[A-Za-z\s]+:\s*/, '').trim();
        if (cleaned) {
          // Split further if there are multiple skills
          const subParts = cleaned.split(/[,|]/).map(s => s.trim()).filter(Boolean);
          for (const sp of subParts) {
            if (sp.length > 1 && sp.length < 50) skills.add(sp);
          }
        }
      }
    }

    // Also check raw line text
    for (const line of lines) {
      const text = line.map(i => i.text).join(' ');
      // Handle "Category: skill1, skill2, skill3" format
      const colonMatch = text.match(/^[A-Za-z\s/&]+:\s*(.+)/);
      if (colonMatch) {
        const skillList = colonMatch[1].split(/[,|•·;]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 50);
        skillList.forEach(s => skills.add(s));
      }
    }
  }

  // Also scan entire text for known skills
  const textLower = allText.toLowerCase();
  for (const skill of COMMON_SKILLS) {
    if (textLower.includes(skill.toLowerCase())) {
      skills.add(skill);
    }
  }

  return Array.from(skills).slice(0, 30);
}
