
// Run tests sequentially to avoid global pollution race conditions
(async () => {
    try {
        await import('./core/input.test.js');
        await import('./drone/battery.test.js');
        await import('./verification/test_physics.js');
        await import('./gameplay/rings.test.js');
        await import('./world/timeCycle.test.js');
        await import('./world/colliders.test.js');
        await import('./dev/history.test.js');

        console.log('\n✨ All tests completed successfully.');
    } catch (e) {
        console.error('\n❌ Tests failed.');
        console.error(e);
        process.exit(1);
    }
})();
