# Who can do what

Blockwright follows Payload's access control. Two things are restricted because they can run scripts on your visitors' browsers:

| Feature | Who |
| --- | --- |
| Pages, templates, menus, site style, form entries | Any logged-in admin-panel user |
| **Custom widgets**, the **Custom HTML** widget, **custom CSS** | Users allowed to post unfiltered HTML |

By default "allowed to post unfiltered HTML" means: a user of your admin user collection **with the `admin` role**, if your users have a `roles` field. If they have no `roles` field, every admin-panel user is allowed.

The **Blockwright** page in the admin sidebar shows which of these applies to your account.

## Symptoms of a missing role

- No **Create new** button on *Custom widgets*.
- The Custom HTML widget and the Custom CSS box keep their previous value when you save.
- With `@payloadcms/plugin-ecommerce` and its `isAdmin` access, no **Create new** button on *Products* either — that one is its rule, not ours.

## Give your account the admin role

The `roles` field usually only accepts changes from an admin, so the first admin has to be set outside the admin panel. Create `make-admin.ts` next to your Payload config:

```ts
import { getPayload } from 'payload'
import config from './payload.config'

const payload = await getPayload({ config })
const email = process.argv[2]
const { docs } = await payload.find({ collection: 'users', where: { email: { equals: email } }, limit: 1 })
if (!docs[0]) throw new Error(`No user with the email ${email}`)
await payload.update({ collection: 'users', id: docs[0].id, data: { roles: ['admin', 'customer'] }, overrideAccess: true })
payload.logger.info(`${email} is now an admin`)
process.exit(0)
```

Run it:

```bash
npx cross-env PAYLOAD_CONFIG_PATH=./dev/payload.config.ts payload run ./dev/make-admin.ts you@example.com
```

Log out and back in so your session picks up the new role.

## Decide for yourself

To let editors build custom widgets, pass your own rule:

```ts
blockwrightPlugin({
  canUseUnfilteredHtml: ({ user }) => Boolean(user) && ['admin', 'editor'].some((r) => (user as { roles?: string[] })?.roles?.includes(r)),
})
```

Returning `() => true` allows every logged-in admin-panel user. Only do that if you trust everyone with an account, since raw HTML can include scripts.
