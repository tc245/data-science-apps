// All of the words on the page, in R and Python versions.
// Written in the same voice as the practical notebooks.

export const TEXT = {
  R: {
    na: "NA",
    labels: { left: "left_join()", inner: "inner_join()", full: "full_join()", right: "right_join()", anti: "anti_join()" },
    dedupe: "distinct()",
    explain: {
      left: `This is the one we want! <code>left_join()</code> keeps <b>every</b> retailer and adds on the datazone from the look-up table. Langmuir Stores is still there, but it has an <code>NA</code> for its datazone because its postcode (QD37 4QD) has been deleted and so isn't in our look-up table. We remove it before counting, just like we did in the practical. The postcodes that don't have any tobacco retailers (like QD37 6HH) are <b>not</b> added, so when we count the rows in each datazone we get the right answer.`,
      inner: `<code>inner_join()</code> keeps <b>only</b> the rows that match in both tables. The counts are actually right here, but look what has happened to Langmuir Stores... it has disappeared without a trace! R doesn't warn us that this has happened, which is why it's always a good idea to check for unmatched rows with <code>anti_join()</code>.`,
      full: `Look at the counts now! <code>full_join()</code> keeps every row from <b>both</b> tables, so every postcode without a tobacco retailer has been added as a row with <code>NA</code> for the retailer's name. When we count the rows in each datazone we are now counting postcodes as well as retailers. DZ00594 doesn't have any tobacco retailers at all, but it now looks like it has 2! And R hasn't given us any warning. This is exactly why we used <code>left_join()</code> for this step in the practical.`,
      right: `<code>right_join()</code> is the mirror image of <code>left_join()</code>: it keeps every row of the <b>second</b> table (the postcodes). So we get the same problem as with <code>full_join()</code>, with postcodes being counted as retailers, and we lose Langmuir Stores as well.`,
      anti: `<code>anti_join()</code> doesn't really join anything. It gives us the rows of the first table that <b>don't</b> have a match in the second table. This is how we found the 228 unmatched retailers in the practical. Here it shows us Langmuir Stores, whose postcode has been deleted. There's nothing to count here, so the counts are left empty.`,
    },
    duplicate: `<b>NOTE:</b> We have added a second copy of QD37 6YN to the look-up table. Look at Inverlea Supermarket... it now appears <b>twice</b> in the joined table, so DZ00593 gets one retailer too many! This is why we checked for duplicate postcodes (and removed them with <code>distinct()</code>) before joining.`,
    code: {
      left: `joined <- tobaccoregister %>%\n    left_join(postcodes, by = "postcode")`,
      inner: `joined <- tobaccoregister %>%\n    inner_join(postcodes, by = "postcode")`,
      full: `joined <- tobaccoregister %>%\n    full_join(postcodes, by = "postcode")`,
      right: `joined <- tobaccoregister %>%\n    right_join(postcodes, by = "postcode")`,
      anti: `unmatched <- tobaccoregister %>%\n    anti_join(postcodes, by = "postcode")`,
    },
    count: `joined %>%\n    filter(!is.na(DataZone2011Code)) %>%\n    group_by(DataZone2011Code) %>%\n    summarise(retailer_count = n())`,
    intro: `In Practical 1 we joined our tobacco register to the postcode look-up so that every retailer got a datazone, and then we counted the retailers in each datazone. Choosing the right type of join here is really important. If you get it wrong you can end up with completely the wrong answer, and R won't give you any error or warning at all!`,
  },
  Python: {
    na: "NaN",
    labels: { left: "how='left'", inner: "how='inner'", full: "how='outer'", right: "how='right'", anti: "~isin()" },
    dedupe: "drop_duplicates()",
    explain: {
      left: `This is the one we want! A left join (<code>how='left'</code>) keeps <b>every</b> retailer and adds on the datazone from the look-up table. Langmuir Stores is still there, but it has a <code>NaN</code> for its datazone because its postcode (QD37 4QD) has been deleted and so isn't in our look-up table. We remove it before counting, just like we did in the practical. The postcodes that don't have any tobacco retailers (like QD37 6HH) are <b>not</b> added, so when we count the rows in each datazone we get the right answer.`,
      inner: `An inner join (<code>how='inner'</code>) keeps <b>only</b> the rows that match in both tables. The counts are actually right here, but look what has happened to Langmuir Stores... it has disappeared without a trace! pandas doesn't warn us that this has happened, which is why it's always a good idea to check for unmatched rows first.`,
      full: `Look at the counts now! An outer join (<code>how='outer'</code>) keeps every row from <b>both</b> tables, so every postcode without a tobacco retailer has been added as a row with <code>NaN</code> for the retailer's name. When we count the rows in each datazone we are now counting postcodes as well as retailers. DZ00594 doesn't have any tobacco retailers at all, but it now looks like it has 2! And pandas hasn't given us any warning. This is exactly why we used a left join for this step in the practical.`,
      right: `A right join (<code>how='right'</code>) is the mirror image of a left join: it keeps every row of the <b>second</b> table (the postcodes). So we get the same problem as with an outer join, with postcodes being counted as retailers, and we lose Langmuir Stores as well.`,
      anti: `pandas doesn't have an "anti-join" function, but we can do the same thing with <code>~isin()</code>. It gives us the rows of the first table whose postcode <b>isn't</b> in the second table. This is how we found the 228 unmatched retailers in the practical. Here it shows us Langmuir Stores, whose postcode has been deleted. There's nothing to count here, so the counts are left empty.`,
    },
    duplicate: `<b>NOTE:</b> We have added a second copy of QD37 6YN to the look-up table. Look at Inverlea Supermarket... it now appears <b>twice</b> in the joined table, so DZ00593 gets one retailer too many! This is why we checked for duplicate postcodes (and removed them with <code>drop_duplicates()</code>) before joining.`,
    code: {
      left: `joined = tobaccoregister.merge(postcodes, on='postcode', how='left')`,
      inner: `joined = tobaccoregister.merge(postcodes, on='postcode', how='inner')`,
      full: `joined = tobaccoregister.merge(postcodes, on='postcode', how='outer')`,
      right: `joined = tobaccoregister.merge(postcodes, on='postcode', how='right')`,
      anti: `unmatched = tobaccoregister[
    ~tobaccoregister['postcode'].isin(postcodes['postcode'])
]`,
    },
    count: `(joined[joined['DataZone2011Code'].notna()]\n    .groupby('DataZone2011Code')\n    .size())`,
    intro: `In Practical 1 we joined our tobacco register to the postcode look-up so that every retailer got a datazone, and then we counted the retailers in each datazone. Choosing the right type of join here is really important. If you get it wrong you can end up with completely the wrong answer, and pandas won't give you any error or warning at all!`,
  },
};
