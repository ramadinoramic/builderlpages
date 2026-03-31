-- Add DELETE policies for authenticated users
CREATE POLICY "Users can delete campaigns" ON campaigns
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can delete clicks" ON clicks
  FOR DELETE TO authenticated USING (true);

CREATE POLICY "Users can delete conversions" ON conversions
  FOR DELETE TO authenticated USING (true);
