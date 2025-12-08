# Remaining Files Migration Checklist

## Files That Still Need Migration

### Priority 1: Critical Pages
- [ ] `src/app/inventory/page.tsx` - Main inventory management (Most used)
- [ ] `src/app/checkin/page.tsx` - Check-in workflow (Critical)
- [ ] `src/app/checkout/page.tsx` - Check-out workflow (Critical)

### Priority 2: Secondary Pages
- [ ] `src/app/scan/page.tsx` - Quick scan functionality
- [ ] `src/app/reports/page.tsx` - Reports and analytics

### Priority 3: Admin Pages
- [ ] `src/app/settings/page.tsx` - Settings and user management
- [ ] `src/app/admin/page.tsx` - Admin clinic management

## Component Replacement Quick Reference

### Form Components
```tsx
// TextInput
<TextInput label="Name" /> 
// → 
<div className="space-y-2">
  <Label htmlFor="name">Name</Label>
  <Input id="name" />
</div>

// PasswordInput
<PasswordInput label="Password" />
// →
<div className="space-y-2">
  <Label htmlFor="password">Password</Label>
  <Input id="password" type="password" />
</div>

// Select
<Select data={options} />
// →
<Select>
  <SelectTrigger>
    <SelectValue placeholder="Select..." />
  </SelectTrigger>
  <SelectContent>
    {options.map(opt => (
      <SelectItem value={opt.value}>{opt.label}</SelectItem>
    ))}
  </SelectContent>
</Select>

// DateInput (from @mantine/dates)
<DateInput />
// → You may need to use a date picker library or create a custom one
// Consider: react-day-picker or just use Input with type="date"
```

### Layout Components
```tsx
// Stack
<Stack gap="md">{children}</Stack>
// →
<div className="space-y-4">{children}</div>

// Group
<Group justify="space-between">{children}</Group>
// →
<div className="flex justify-between items-center gap-4">{children}</div>

// Paper
<Paper withBorder shadow="sm" p="md">{children}</Paper>
// →
<Card>{children}</Card>
```

### Data Display
```tsx
// Table
<Table>
  <Table.Thead>...</Table.Thead>
  <Table.Tbody>...</Table.Tbody>
</Table>
// →
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>...</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    <TableRow>
      <TableCell>...</TableCell>
    </TableRow>
  </TableBody>
</Table>

// Badge
<Badge color="blue">Status</Badge>
// →
<Badge>Status</Badge>
// Note: Use className for custom colors

// Alert
<Alert icon={<IconInfo />} title="Note">Message</Alert>
// →
<Alert>
  <Info className="h-4 w-4" />
  <AlertTitle>Note</AlertTitle>
  <AlertDescription>Message</AlertDescription>
</Alert>
```

### Feedback
```tsx
// notifications.show()
notifications.show({
  title: 'Success',
  message: 'Data saved',
  color: 'green',
});
// →
const { toast } = useToast();
toast({
  title: 'Success',
  description: 'Data saved',
});

// Loader
<Loader size="lg" />
// →
<Loader2 className="h-8 w-8 animate-spin" />
```

### Modals/Dialogs
```tsx
// Modal
<Modal opened={open} onClose={handleClose} title="Edit">
  {content}
</Modal>
// →
<Dialog open={open} onOpenChange={setOpen}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Edit</DialogTitle>
    </DialogHeader>
    {content}
  </DialogContent>
</Dialog>
```

### Icons
```tsx
// @tabler/icons-react → lucide-react
IconCheck → Check
IconX → X
IconAlertCircle → AlertCircle
IconTrash → Trash2
IconEdit → Edit
IconPlus → Plus
IconMinus → Minus
IconSearch → Search
IconCalendar → Calendar
IconUser → User
IconMail → Mail
IconLock → Lock
IconEye → Eye
IconEyeOff → EyeOff
IconHome → Home
IconSettings → Settings
IconLogout → LogOut
IconDownload → Download
IconUpload → Upload
IconPrinter → Printer
IconRefresh → RefreshCw
IconArrowLeft → ArrowLeft
IconArrowRight → ArrowRight
IconChevronDown → ChevronDown
IconChevronUp → ChevronUp
```

## Testing Checklist

After migrating each page, test:
- [ ] All forms submit correctly
- [ ] All GraphQL queries/mutations work
- [ ] Responsive design on mobile/tablet
- [ ] All buttons and links work
- [ ] Modals/dialogs open and close
- [ ] Tables display data correctly
- [ ] Sorting and filtering work (if applicable)
- [ ] Error states display properly
- [ ] Loading states work
- [ ] Toast notifications appear

## Tips

1. **Migrate one page at a time** - Don't try to do all at once
2. **Test thoroughly** - Each page has critical business logic
3. **Keep business logic intact** - Only change UI components
4. **Use the browser console** - Catch TypeScript/React errors early
5. **Check mobile view** - Use browser dev tools to test responsive design
6. **Refer to existing components** - Look at signin/signup/home pages as examples
7. **Use shadcn/ui docs** - https://ui.shadcn.com/ for component APIs

## Additional Components You May Need

If you encounter components not yet installed, add them via:

```bash
npx shadcn@latest add [component-name]
```

Available components:
- checkbox
- radio-group
- switch
- slider
- calendar
- date-picker
- popover
- combobox
- command
- context-menu
- menubar
- accordion
- collapsible
- hover-card
- breadcrumb
- pagination
- resizable
- sonner (alternative toast)
