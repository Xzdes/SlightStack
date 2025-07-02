// Файл: core/tracker.js

const dependencyStack = [];

function startTracking(updater) {
    dependencyStack.push(updater);
}

function stopTracking() {
    dependencyStack.pop();
}

function getActiveUpdater() {
    return dependencyStack[dependencyStack.length - 1];
}

module.exports = { startTracking, stopTracking, getActiveUpdater };