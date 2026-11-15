# APX Token Information Rebuild

## Direction

**Chosen style:** institutional dark-finance editorial (0.62 probability), with a restrained gold accent and clear evidence/status labels. Alternatives considered: crypto-terminal dashboard (0.08) and luxury investment brochure (0.05).

**Design movement:** a compact investor brief with strong section hierarchy, wide cards, and a milestone rail rather than a generic marketing grid.

**Core principles:** distinguish live functionality from planned work; make contract and economic parameters scannable; use plain language for market and redemption mechanics; keep the page credible on mobile.

**Color philosophy:** near-black surfaces convey focus, gold marks the APX brand and key metrics, cool blue/green accents identify blockchain and operational flows without implying performance.

**Layout paradigm:** editorial hero followed by a two-column evidence panel, a horizontal-to-vertical roadmap rail, and compact reference sections.

**Signature elements:** APX logo lockup, status chips (Live / Building / Planned), and a milestone rail with numbered phases.

**Interaction philosophy:** direct links to BscScan, PancakeSwap, tokenomics and litepaper; no exaggerated CTAs or unsupported price claims.

**Typography:** existing site system with large high-contrast headings, compact uppercase labels, and tabular numerals for rates and supply.

**Brand essence:** APX is a BNB Smart Chain utility and rewards token connected to the APXFund platform; practical, transparent, evolving.

## Implementation

- Rebuild `/token` as the canonical APX overview with live contract details, utility, market access, and roadmap preview.
- Rebuild `/tokenomics` as a structured economic model with parameters, flows, status labels, and risk-aware operating notes.
- Replace the current incorrect `/litepaper` implementation with a complete long-form litepaper covering thesis, product utility, token mechanics, roadmap, governance, security, and glossary.
- Reuse configured values from `lib/apx.ts`; do not invent dates, guarantees, or completed milestones.
- Add the prepared square APX logo asset to the token overview.

## Project structure

- `app/token/page.tsx`: public APX overview and roadmap preview.
- `app/tokenomics/page.tsx`: economic mechanics and token flows.
- `app/litepaper/page.tsx`: long-form APX litepaper.
- `public/apx-token-logo-100kb.png`: wallet-ready APX logo.
