// Citation chips must call onRef with their own id after rendering completes.
import assert from 'node:assert/strict';
import { isValidElement, type ReactElement, type ReactNode } from 'react';
import Markdown from '../../components/Markdown';
const clicked: string[] = [];
const tree = Markdown({ text: 'Mệnh có Vũ Khúc [F3] và nguồn [[S1]].', onRef: id => clicked.push(id) });
const buttons: ReactElement<{ onClick: () => void }>[] = [];
const walk = (n: ReactNode) => {
  if (Array.isArray(n)) return n.forEach(walk);
  if (!isValidElement(n)) return;
  const el = n as ReactElement<{ onClick?: () => void; children?: ReactNode }>;
  if (el.type === 'button') buttons.push(el as ReactElement<{ onClick: () => void }>);
  walk(el.props.children);
};
walk(tree);
assert.equal(buttons.length, 2);
buttons.forEach(b => b.props.onClick());
assert.deepEqual(clicked, ['F3', 'S1']);
console.log('markdown citation chips: click handlers resolve their own ids');
