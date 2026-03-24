# Contributing to Alda

Thank you for your interest in Alda.

## Ways to contribute

### Bug reports
Open an issue with the `bug` label. Include:
- Alda version
- Minimal `.alda` file that reproduces the issue
- Expected vs. actual behavior

### Format proposals (RFC)
Major changes to the format spec go through the RFC process:

1. Copy `RFC/0001-template.md` → `RFC/NNNN-your-title.md`
2. Fill in motivation, design, and drawbacks
3. Open a pull request for discussion

Minor clarifications can be submitted directly as PRs to `spec/`.

### Code (`alda-js`)
1. Fork the repo
2. `cd alda-js && node test/index.test.js` — all tests must pass
3. Add tests for new behavior
4. Open a pull request

### Examples
Sample `.alda` files in `examples/` are always welcome.

## Code style

- `alda-js` targets Node.js ≥ 16 and modern browsers — no build step
- No external runtime dependencies
- CommonJS (`require`/`module.exports`) for maximum compatibility

## License

By contributing you agree that your contributions will be licensed under:
- MIT (code)
- CC BY 4.0 (spec documents)
