package com.assetserve.monetary.controller;

import com.assetserve.monetary.filter.Scrip;
import com.assetserve.monetary.service.ScripMasterService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/scriplist")
public class ScripListController {
    @Autowired
    private ScripMasterService scripMasterService;

    @GetMapping("/search")
    public List<Scrip> search(@RequestParam String q) {
        return scripMasterService.searchScrips(q);
    }
}
