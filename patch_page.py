with open('frontend/app/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Add import
import_target = "import { Issue, DependencyItem, ScanResult, CategoryType, SeverityLevel } from '@/types/scanner';"
import_replacement = """import { Issue, DependencyItem, ScanResult, CategoryType, SeverityLevel } from '@/types/scanner';
import { runClientScan, scanSingleFileClient } from '@/utils/clientScanner';"""

text = text.replace(import_target, import_replacement, 1)

# 2. Update runScan catch block
catch_target = """    } catch (err: any) {
      setErrorMsg(err.message || 'Scan failed.');
      addToast('error', 'Scan failed. Ensure FastAPI backend is running on port 8000.');
    } finally {"""

catch_replacement = """    } catch (err: any) {
      // Seamless zero-latency offline client scanner fallback
      console.log('[CLYRO] Running client-side offline scan engine...');
      const clientData = runClientScan(payloadFiles);
      setScanResult(clientData);
      setScanProgress(100);

      const fileWithIssues = activeList.find((f) =>
        clientData.issues.some((i) => i.filePath === f.path)
      );
      if (fileWithIssues) {
        setActiveFilePath(fileWithIssues.path);
        const firstIssue = clientData.issues.find((i) => i.filePath === fileWithIssues.path);
        if (firstIssue) setSelectedIssueId(firstIssue.id);
      }

      addToast('success', `Offline scan completed. ${clientData.totalIssues} issues found.`);
    } finally {"""

text = text.replace(catch_target, catch_replacement, 1)

# 3. Update handleCodeChange catch block
code_change_target = """        if (res.ok) {
          const data = await res.json();
          const newFileIssues: Issue[] = data.issues || [];

          setScanResult((prev) => {
            if (!prev) return null;
            const otherIssues = prev.issues.filter((i) => i.filePath !== activeFilePath);
            const mergedIssues = [...otherIssues, ...newFileIssues];

            let score = 100;
            const sevCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
            const catCounts: Record<CategoryType, number> = {
              error: 0,
              bug: 0,
              security: 0,
              performance: 0,
              dependency: prev.dependencies.length,
              quality: 0,
            };

            for (const issue of mergedIssues) {
              if (issue.severity === 'Critical') score -= 15;
              else if (issue.severity === 'High') score -= 8;
              else if (issue.severity === 'Medium') score -= 4;
              else if (issue.severity === 'Low') score -= 1;

              sevCounts[issue.severity]++;
              catCounts[issue.category]++;
            }

            for (const dep of prev.dependencies) {
              if (dep.status === 'Known-vulnerable') score -= 10;
              else if (dep.status === 'Deprecated') score -= 5;
              else if (dep.status === 'Outdated') score -= 2;
            }

            return {
              ...prev,
              issues: mergedIssues,
              totalIssues: mergedIssues.length,
              severityCounts: sevCounts,
              categoryCounts: catCounts,
              healthScore: Math.max(0, Math.min(100, score)),
            };
          });
        }
      } catch (err) { }"""

code_change_replacement = """        let newFileIssues: Issue[] = [];
        if (res.ok) {
          const data = await res.json();
          newFileIssues = data.issues || [];
        } else {
          newFileIssues = scanSingleFileClient(activeFilePath, newCode);
        }

        setScanResult((prev) => {
          if (!prev) return null;
          const otherIssues = prev.issues.filter((i) => i.filePath !== activeFilePath);
          const mergedIssues = [...otherIssues, ...newFileIssues];

          let score = 100;
          const sevCounts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
          const catCounts: Record<CategoryType, number> = {
            error: 0,
            bug: 0,
            security: 0,
            performance: 0,
            dependency: prev.dependencies.length,
            quality: 0,
          };

          for (const issue of mergedIssues) {
            if (issue.severity === 'Critical') score -= 15;
            else if (issue.severity === 'High') score -= 8;
            else if (issue.severity === 'Medium') score -= 4;
            else if (issue.severity === 'Low') score -= 1;

            sevCounts[issue.severity]++;
            catCounts[issue.category]++;
          }

          for (const dep of prev.dependencies) {
            if (dep.status === 'Known-vulnerable') score -= 10;
            else if (dep.status === 'Deprecated') score -= 5;
            else if (dep.status === 'Outdated') score -= 2;
          }

          return {
            ...prev,
            issues: mergedIssues,
            totalIssues: mergedIssues.length,
            severityCounts: sevCounts,
            categoryCounts: catCounts,
            healthScore: Math.max(0, Math.min(100, score)),
          };
        });
      } catch (err) {
        const newFileIssues = scanSingleFileClient(activeFilePath, newCode);
        setScanResult((prev) => {
          if (!prev) return null;
          const otherIssues = prev.issues.filter((i) => i.filePath !== activeFilePath);
          const mergedIssues = [...otherIssues, ...newFileIssues];
          return {
            ...prev,
            issues: mergedIssues,
            totalIssues: mergedIssues.length,
          };
        });
      }"""

text = text.replace(code_change_target, code_change_replacement, 1)

with open('frontend/app/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

print('Updated page.tsx with clientScanner fallback successfully!')
