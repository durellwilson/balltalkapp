# Navigation Fixes Documentation

## Tab Navigation Error Fix: "Cannot use `href` and `tabBarButton` together"

### Issue Description

The application was encountering the following error during startup:

```
Uncaught Error
Cannot use `href` and `tabBarButton` together.
```

This error occurs in Expo Router when a `Tabs.Screen` component has both `href` and `tabBarButton` properties defined simultaneously, which creates a conflict in the routing system.

### Root Cause Analysis

In the `app/(tabs)/_layout.tsx` file, the "discover" tab had conflicting properties:

```tsx
<Tabs.Screen
  name="discover"
  options={{
    href: null,
    tabBarButton: () => null
  }}
/>
```

Expo Router does not allow using both `href` and `tabBarButton` together, even when one is set to `null`.

### Solution

The fix involves completely removing the `href` property and only using `tabBarButton` for hidden tabs:

```tsx
<Tabs.Screen
  name="discover"
  options={{
    tabBarButton: () => null
  }}
/>
```

By removing the `href` property completely rather than trying to set it to `null` or configure it differently, we avoid the conflict in Expo Router's tab navigator.

### Alternative Solutions (If Needed)

If the tab still needs specific routing behavior while being hidden, consider:

1. Using a parent layout file to define routing rules
2. Using `initialRouteName` in the tab navigator to control initial routing
3. Handling navigation programmatically using the `useRouter` hook

### Testing

We've added a test case in `__tests__/TabNavigation.test.tsx` that verifies the tab layout renders without errors.

You can run the navigation tests using:

```bash
node scripts/test-navigation.js
```

### Additional Notes

When working with Expo Router and tab navigation, remember the following:

1. **Mutually Exclusive Properties**: Never use both `href` and `tabBarButton` on the same tab screen - they cannot be used together.
2. **Hidden Tabs**: For tabs that should be hidden from the tab bar, only use `tabBarButton: () => null`.
3. **Custom Routing**: For custom routing needs, handle navigation programmatically rather than through conflicting tab properties.

### References

- [Expo Router Documentation](https://docs.expo.dev/router/reference/troubleshooting)
- [React Navigation Tab Navigator](https://reactnavigation.org/docs/bottom-tab-navigator/) 