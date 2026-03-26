export interface Skill {
  name: string;
  description: string;
  trigger?: string;
  content: string;
  scope: 'builtin' | 'global' | 'project';
  path: string;
  version?: string;
}
