import { type FamilyNode, familyTree } from "../../../../src/open-source";

// Forks and derivatives as lineages: parent on the left, each derivative to
// its right, branches stacked.
function Node({ node, onSelect }: { node: FamilyNode; onSelect: (id: string) => void }) {
    return (
        <li>
            <button type="button" className="os-node" onClick={() => onSelect(node.robot.id)}>
                {node.robot.name}
            </button>
            {node.children.length > 0 && (
                <ul>
                    {node.children.map((c) => (
                        <Node key={c.robot.id} node={c} onSelect={onSelect} />
                    ))}
                </ul>
            )}
        </li>
    );
}

export function FamilyTree({ onSelect }: { onSelect: (id: string) => void }) {
    return (
        <div className="os-tree">
            {familyTree().map((root) => (
                <ul key={root.robot.id} className="os-lineage" aria-label={`${root.robot.name} lineage`}>
                    <Node node={root} onSelect={onSelect} />
                </ul>
            ))}
        </div>
    );
}
