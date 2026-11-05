# ADR [NNNN]: [Short Title of the Decision]

* **Status:** Proposed | Accepted | Deprecated | Superseded by [ADR-XXXX]
* **Date:** YYYY-MM-DD
* **Authors:** Paula / Engineering Team
* **Milestone:** Milestone [N]

---

## 1. Context & Problem Statement
*What problem are we trying to solve? What is the current architectural situation?*
*Include relevant technical constraints, metrics, data scale, and pain points.*

---

## 2. Decision
*What architectural change or pattern are we choosing to adopt?*
*Be clear and specific about the design and the scope of implementation.*

---

## 3. Alternatives Considered
*What other viable designs, tools, or patterns were evaluated, and why were they rejected?*

* **Alternative 1: [Name]**
  * *Why rejected:* [Detailed technical rationale]
* **Alternative 2: [Name]**
  * *Why rejected:* [Detailed technical rationale]

---

## 4. Consequences & Tradeoffs
*What becomes easier, and what becomes harder or is lost as a result of this decision?*
*Be transparent and honest about downsides, operational changes, and risks.*

### Positive (Gains)
* [e.g. Memory reduction, simplified deployment, lower latency]

### Negative (Downsides & Lost Capabilities)
* [e.g. Loss of multi-node shared cache, state lost on process restarts]

### Neutral / Operational Impacts
* [e.g. Monitoring changes, tooling changes]

---

## 5. How to Verify
*Exact, reproducible commands to verify that the decision is correctly implemented and performing as intended.*

```bash
# 1. Verification command 1
# 2. Verification command 2
```

### Acceptance Criteria
- [ ] Criterion 1
- [ ] Criterion 2
