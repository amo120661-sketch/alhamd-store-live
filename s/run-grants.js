async (page) => {
  const sql = `grant usage on schema public to anon, authenticated;
grant all privileges on all tables in schema public to anon, authenticated;
grant all privileges on all sequences in schema public to anon, authenticated;
alter default privileges in schema public grant all on tables to anon, authenticated;
alter default privileges in schema public grant all on sequences to anon, authenticated;
select 'grants ok' as status;`;
  await page.locator('.monaco-editor .view-lines').first().click();
  await page.keyboard.insertText(sql);
  return 'typed';
}
