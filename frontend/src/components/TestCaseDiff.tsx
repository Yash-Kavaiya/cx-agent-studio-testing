import { useMemo } from 'react'

interface TestCaseDiffProps {
    oldJson: any
    newJson: any
    oldVersion: number
    newVersion: number
}

interface DiffLine {
    type: 'added' | 'removed' | 'unchanged'
    content: string
}

function computeDiff(oldStr: string, newStr: string): DiffLine[] {
    const oldLines = oldStr.split('\n')
    const newLines = newStr.split('\n')
    const result: DiffLine[] = []

    // Simple line-by-line diff
    let oi = 0, ni = 0
    while (oi < oldLines.length || ni < newLines.length) {
        if (oi >= oldLines.length) {
            result.push({ type: 'added', content: newLines[ni] })
            ni++
        } else if (ni >= newLines.length) {
            result.push({ type: 'removed', content: oldLines[oi] })
            oi++
        } else if (oldLines[oi] === newLines[ni]) {
            result.push({ type: 'unchanged', content: oldLines[oi] })
            oi++
            ni++
        } else {
            // Look ahead for a match
            let foundInNew = -1
            let foundInOld = -1
            for (let k = 1; k <= 5 && ni + k < newLines.length; k++) {
                if (oldLines[oi] === newLines[ni + k]) { foundInNew = k; break }
            }
            for (let k = 1; k <= 5 && oi + k < oldLines.length; k++) {
                if (oldLines[oi + k] === newLines[ni]) { foundInOld = k; break }
            }

            if (foundInNew > 0 && (foundInOld < 0 || foundInNew <= foundInOld)) {
                for (let k = 0; k < foundInNew; k++) {
                    result.push({ type: 'added', content: newLines[ni + k] })
                }
                ni += foundInNew
            } else if (foundInOld > 0) {
                for (let k = 0; k < foundInOld; k++) {
                    result.push({ type: 'removed', content: oldLines[oi + k] })
                }
                oi += foundInOld
            } else {
                result.push({ type: 'removed', content: oldLines[oi] })
                result.push({ type: 'added', content: newLines[ni] })
                oi++
                ni++
            }
        }
    }

    return result
}

export default function TestCaseDiff({ oldJson, newJson, oldVersion, newVersion }: TestCaseDiffProps) {
    const diffLines = useMemo(() => {
        const oldStr = JSON.stringify(oldJson, null, 2)
        const newStr = JSON.stringify(newJson, null, 2)
        return computeDiff(oldStr, newStr)
    }, [oldJson, newJson])

    const additions = diffLines.filter(l => l.type === 'added').length
    const deletions = diffLines.filter(l => l.type === 'removed').length

    return (
        <div className="border rounded-lg overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 bg-gray-100 border-b">
                <span className="text-sm font-medium text-gray-700">
                    v{oldVersion} → v{newVersion}
                </span>
                <div className="flex gap-3 text-xs">
                    <span className="text-green-600 font-medium">+{additions} additions</span>
                    <span className="text-red-600 font-medium">−{deletions} deletions</span>
                </div>
            </div>
            <div className="overflow-auto max-h-96 font-mono text-xs leading-5">
                {diffLines.map((line, i) => (
                    <div
                        key={i}
                        className={`px-4 py-0.5 border-l-2 ${line.type === 'added'
                            ? 'bg-green-50 border-green-500 text-green-800'
                            : line.type === 'removed'
                                ? 'bg-red-50 border-red-500 text-red-800'
                                : 'border-transparent text-gray-600'
                            }`}
                    >
                        <span className="inline-block w-4 mr-2 text-gray-400 select-none">
                            {line.type === 'added' ? '+' : line.type === 'removed' ? '−' : ' '}
                        </span>
                        {line.content}
                    </div>
                ))}
            </div>
        </div>
    )
}
